<?php

namespace App\Controller;

use App\Entity\Deployments;
use App\Entity\Modules;
use App\Entity\Models;
use App\Entity\Fields;
use App\Entity\Views;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class OdooDeployController extends AbstractController
{
    // Necesitamos el HttpClient para comunicarnos con Odoo
    private $httpClient;

    public function __construct(HttpClientInterface $httpClient)
    {
        $this->httpClient = $httpClient;
    }

    // ──────────────────────────────────────────────
    //  ENDPOINT PRINCIPAL
    // ──────────────────────────────────────────────

    public function deployToOdoo(Request $request, SerializerInterface $serializer)
    {
        $moduleId = $request->get('id');
        $entityManager = $this->getDoctrine()->getManager();

        // 1. Obtener el módulo de la BD
        $module = $entityManager
            ->getRepository(Modules::class)
            ->find($moduleId);

        if (!$module) {
            return $this->json(['success' => false, 'error' => 'Module not found'], 404);
        }

        $technicalName = $module->getTechnicalName();
        $addonsPath = $this->getParameter('odoo_addons_path');
        $targetPath = $addonsPath . '/' . $technicalName;
        $backupPath = $addonsPath . '/.' . $technicalName . '_backup';
        $backupUsed = false;

        try {
            // 2. Construir el JSON completo del módulo
            $moduleData = $this->buildModuleFullData($module, $entityManager);

            // 3. Generar el ZIP a través del servidor Java
            $zipData = $this->generateZipFromJava($moduleData);
            if ($zipData === null) {
                return $this->json(['success' => false, 'error' => 'Failed to generate module ZIP'], 500);
            }

            // 4. Hacer backup del módulo existente (si lo hay) antes de tocarlo
            if (is_dir($targetPath)) {
                $this->removeDirectory($backupPath);
                // Mover en lugar de copiar para que sea instantáneo
                if (rename($targetPath, $backupPath)) {
                    $backupUsed = true;
                }
            }

            // 5. Extraer el ZIP en la carpeta addons de Odoo
            $extractResult = $this->extractZipToDirectory($zipData, $targetPath);
            if ($extractResult['success'] === false) {
                // Restaurar backup si existe
                if ($backupUsed) {
                    $this->restoreBackup($backupPath, $targetPath);
                }
                return $this->json(['success' => false, 'error' => $extractResult['error']], 500);
            }

            // 6. Instalar (o actualizar) el módulo en Odoo
            $installResult = $this->installOrUpgradeModuleInOdoo($technicalName);

            // 7. Si hay error, restaurar backup y notificar
            if (!$installResult['success']) {
                $errorMsg = $installResult['error'] ?? 'Unknown error during installation';

                // Restaurar la versión anterior
                $this->removeDirectory($targetPath);
                if ($backupUsed) {
                    $this->restoreBackup($backupPath, $targetPath);
                }

                $this->recordDeployment($module, 'error', $errorMsg, $entityManager);

                return $this->json([
                    'success' => false,
                    'error' => $errorMsg,
                    'log' => $installResult['log'] ?? '',
                    'restored' => $backupUsed,
                ], 500);
            }

            // 8. Éxito: eliminar backup
            if ($backupUsed) {
                $this->removeDirectory($backupPath);
            }

            $successMsg = "Module '{$technicalName}' deployed and installed successfully in Odoo";
            $this->recordDeployment($module, 'success', $successMsg, $entityManager);

            return $this->json([
                'success' => true,
                'message' => $successMsg,
            ]);
        } catch (\Exception $e) {
            // Error inesperado: restaurar backup si existe
            if ($backupUsed && !is_dir($targetPath)) {
                $this->restoreBackup($backupPath, $targetPath);
            } elseif ($backupUsed && is_dir($targetPath)) {
                $this->removeDirectory($targetPath);
                $this->restoreBackup($backupPath, $targetPath);
            }

            $errorMsg = 'Unexpected error: ' . $e->getMessage();
            $this->recordDeployment($module, 'error', $errorMsg, $entityManager);

            return $this->json([
                'success' => false,
                'error' => $errorMsg,
                'restored' => $backupUsed,
            ], 500);
        }
    }

    // ──────────────────────────────────────────────
    //  INSTALACIÓN EN ODOO (install / upgrade / reinstall)
    // ──────────────────────────────────────────────

    
    // Instala el módulo si no existe, o lo actualiza si ya existe.
    // Si el upgrade falla, intenta desinstalar y reinstalar desde cero.
    private function installOrUpgradeModuleInOdoo(string $technicalName): array
    {
        $odooHost = $this->getParameter('odoo_host');
        $odooPort = $this->getParameter('odoo_port');
        $odooDb = $this->getParameter('odoo_db');
        $odooUser = $this->getParameter('odoo_user');
        $odooPassword = $this->getParameter('odoo_password');

        $baseUrl = "http://{$odooHost}:{$odooPort}";

        try {
            // Autenticación
            $uid = $this->odooLogin($baseUrl, $odooDb, $odooUser, $odooPassword);
            if ($uid === null) {
                // Si la API no funciona, intentar con odoo bin (fallback)
                return $this->installModuleViaOdooBin($technicalName);
            }

            // Buscar el módulo en Odoo
            $moduleInfo = $this->findModule($baseUrl, $uid, $odooDb, $odooPassword, $technicalName);

            // Si no se encuentra, actualizar la lista de módulos y buscar de nuevo
            if ($moduleInfo === null) {
                $this->updateModuleList($baseUrl, $uid, $odooDb, $odooPassword);
                usleep(500000); // 0.5 segundos para que Odoo procese
                $moduleInfo = $this->findModule($baseUrl, $uid, $odooDb, $odooPassword, $technicalName);
            }

            // Si sigue sin aparecer, error
            if ($moduleInfo === null) {
                return [
                    'success' => false,
                    'error' => "Module '{$technicalName}' not found in Odoo even after update_list. "
                        . "Check that the module files are correctly placed in the addons directory.",
                ];
            }

            $moduleId = $moduleInfo['id'];
            $state = $moduleInfo['state'];

            if ($state === 'uninstalled') {
                // No instalado: instalar
                return $this->odooInstallModule($baseUrl, $uid, $odooDb, $odooPassword, $moduleId, $technicalName);
            } elseif ($state === 'installed' || $state === 'to upgrade') {
                // Ya instalado: intentar upgrade primero (recarga modelos, vistas, etc.)
                $upgradeResult = $this->odooUpgradeModule($baseUrl, $uid, $odooDb, $odooPassword, $moduleId, $technicalName);
                if ($upgradeResult['success']) {
                    return $upgradeResult;
                }
                // Si upgrade falla: desinstalar y reinstalar desde cero
                return $this->odooReinstallModule($baseUrl, $uid, $odooDb, $odooPassword, $moduleId, $technicalName);
            } else {
                // Estado desconocido (to remove, etc.): intentar instalar
                return $this->odooInstallModule($baseUrl, $uid, $odooDb, $odooPassword, $moduleId, $technicalName);
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Odoo API error: ' . $e->getMessage(),
            ];
        }
    }

    // ──────────────────────────────────────────────
    //  MÉTODOS AUXILIARES DE LA API ODOO
    // ──────────────────────────────────────────────

    // Autentica en Odoo y devuelve el UID, o null si falla
    private function odooLogin(string $baseUrl, string $db, string $user, string $password): ?int
    {
        try {
            $response = $this->httpClient->request('POST', $baseUrl . '/jsonrpc', [
                'json' => [
                    'jsonrpc' => '2.0',
                    'method' => 'call',
                    'params' => [
                        'service' => 'common',
                        'method' => 'login',
                        'args' => [$db, $user, $password],
                    ],
                    'id' => 1,
                ],
                'timeout' => 10,
            ]);

            $data = json_decode($response->getContent(), true);
            $uid = $data['result'] ?? null;

            return (is_numeric($uid) && $uid > 0) ? (int)$uid : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    // Busca un módulo por nombre técnico y devuelve {id, name, state} o null
    private function findModule(string $baseUrl, int $uid, string $db, string $password, string $technicalName): ?array
    {
        try {
            $response = $this->httpClient->request('POST', $baseUrl . '/jsonrpc', [
                'json' => [
                    'jsonrpc' => '2.0',
                    'method' => 'call',
                    'params' => [
                        'service' => 'object',
                        'method' => 'execute_kw',
                        'args' => [
                            $db,
                            $uid,
                            $password,
                            'ir.module.module',
                            'search_read',
                            [
                                [['name', '=', $technicalName]],
                            ],
                            ['fields' => ['id', 'name', 'state'], 'limit' => 1],
                        ],
                    ],
                    'id' => 2,
                ],
                'timeout' => 10,
            ]);

            $data = json_decode($response->getContent(), true);
            $modules = $data['result'] ?? [];

            return !empty($modules) ? $modules[0] : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    // Actualiza la lista de módulos en Odoo (para que aparezcan los nuevos)
    private function updateModuleList(string $baseUrl, int $uid, string $db, string $password): void
    {
        try {
            $this->httpClient->request('POST', $baseUrl . '/jsonrpc', [
                'json' => [
                    'jsonrpc' => '2.0',
                    'method' => 'call',
                    'params' => [
                        'service' => 'object',
                        'method' => 'execute_kw',
                        'args' => [
                            $db,
                            $uid,
                            $password,
                            'ir.module.module',
                            'update_list',
                            [],
                        ],
                    ],
                    'id' => 10,
                ],
                'timeout' => 60,
            ]);
        } catch (\Exception $e) {
            // No crítico
        }
    }

    // Instala un módulo en estado 'uninstalled'
    private function odooInstallModule(string $baseUrl, int $uid, string $db, string $password, int $moduleId, string $technicalName): array
    {
        try {
            $response = $this->httpClient->request('POST', $baseUrl . '/jsonrpc', [
                'json' => [
                    'jsonrpc' => '2.0',
                    'method' => 'call',
                    'params' => [
                        'service' => 'object',
                        'method' => 'execute_kw',
                        'args' => [
                            $db,
                            $uid,
                            $password,
                            'ir.module.module',
                            'button_immediate_install',
                            [[$moduleId]],
                        ],
                    ],
                    'id' => 4,
                ],
                'timeout' => 120,
            ]);

            $data = json_decode($response->getContent(), true);

            if (isset($data['error'])) {
                return [
                    'success' => false,
                    'error' => 'Odoo install error: ' . ($data['error']['message'] ?? json_encode($data['error'])),
                ];
            }

            return ['success' => true];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Odoo install exception: ' . $e->getMessage(),
            ];
        }
    }

    // Actualiza un módulo ya instalado (recarga modelos, vistas, campos desde los ficheros)
    private function odooUpgradeModule(string $baseUrl, int $uid, string $db, string $password, int $moduleId, string $technicalName): array
    {
        try {
            $response = $this->httpClient->request('POST', $baseUrl . '/jsonrpc', [
                'json' => [
                    'jsonrpc' => '2.0',
                    'method' => 'call',
                    'params' => [
                        'service' => 'object',
                        'method' => 'execute_kw',
                        'args' => [
                            $db,
                            $uid,
                            $password,
                            'ir.module.module',
                            'button_immediate_upgrade',
                            [[$moduleId]],
                        ],
                    ],
                    'id' => 6,
                ],
                'timeout' => 120,
            ]);

            $data = json_decode($response->getContent(), true);

            if (isset($data['error'])) {
                return [
                    'success' => false,
                    'error' => 'Odoo upgrade error: ' . ($data['error']['message'] ?? json_encode($data['error'])),
                ];
            }

            return ['success' => true];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Odoo upgrade exception: ' . $e->getMessage(),
            ];
        }
    }

    // Desinstala y reinstala un módulo (para forzar nuevos ficheros)
    private function odooReinstallModule(string $baseUrl, int $uid, string $db, string $password, int $moduleId, string $technicalName): array
    {
        // 1. Desinstalar
        try {
            $this->httpClient->request('POST', $baseUrl . '/jsonrpc', [
                'json' => [
                    'jsonrpc' => '2.0',
                    'method' => 'call',
                    'params' => [
                        'service' => 'object',
                        'method' => 'execute_kw',
                        'args' => [
                            $db,
                            $uid,
                            $password,
                            'ir.module.module',
                            'button_immediate_uninstall',
                            [[$moduleId]],
                        ],
                    ],
                    'id' => 5,
                ],
                'timeout' => 120,
            ]);
        } catch (\Exception $e) {
            // Si falla la desinstalación, continuamos e intentamos instalar igualmente
        }

        // Pequeña pausa para que Odoo procese la desinstalación
        usleep(500000); // 0.5 segundos

        // 2. Reinstalar
        return $this->odooInstallModule($baseUrl, $uid, $db, $password, $moduleId, $technicalName);
    }

    // ──────────────────────────────────────────────
    //  FALLBACK: INSTALAR CON ODOO BIN (DOCKER)
    // ──────────────────────────────────────────────

    private function installModuleViaOdooBin(string $technicalName): array
    {
        try {
            $command = sprintf(
                'docker exec omb_odoo odoo -d %s -u %s --stop-after-init --addons-path=/mnt/extra-addons 2>&1',
                escapeshellarg($this->getParameter('odoo_db')),
                escapeshellarg($technicalName)
            );

            $output = shell_exec($command);

            if ($output === null) {
                return ['success' => false, 'error' => 'Failed to execute odoo command in container'];
            }

            if (strpos($output, 'Traceback') !== false ||
                preg_match('/ERROR.*' . preg_quote($technicalName, '/') . '/i', $output)) {
                return ['success' => false, 'error' => 'Odoo installation error', 'log' => substr($output, -2000)];
            }

            return ['success' => true];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => 'Exception: ' . $e->getMessage()];
        }
    }

    // ──────────────────────────────────────────────
    //  GENERACIÓN DEL MÓDULO (ZIP)
    // ──────────────────────────────────────────────

    private function buildModuleFullData(Modules $module, $entityManager): array
    {
        $modelRepo = $entityManager->getRepository(Models::class);
        $fieldRepo = $entityManager->getRepository(Fields::class);
        $viewRepo = $entityManager->getRepository(Views::class);

        $models = $modelRepo->findBy(['module' => $module]);
        $modelsData = [];

        foreach ($models as $model) {
            $fields = $fieldRepo->findBy(['model' => $model]);
            $views = $viewRepo->findBy(['model' => $model]);

            $modelsData[] = [
                'id' => $model->getId(),
                'name' => $model->getName(),
                'technicalName' => $model->getTechnicalName(),
                'fields' => array_map(function($field) {
                    return [
                        'id' => $field->getId(),
                        'name' => $field->getName(),
                        'technicalName' => $field->getTechnicalName(),
                        'type' => $field->getType(),
                        'required' => $field->getRequired(),
                        'unique' => $field->getUniqueField(),
                        'relationModel' => $field->getRelationModel(),
                        'relationField' => $field->getRelationField(),
                        'defaultValue' => $field->getDefaultValue(),
                        'selectionOptions' => $field->getSelectionOptions(),
                        'rules' => $field->getRules(),
                        'relationModule' => (in_array($field->getType(), ['many2one', 'one2many', 'many2many', 'one2one']) && $field->getRelationModule()) ? $field->getRelationModule() : null,
                    ];
                }, $fields),
                'views' => array_map(function($view) {
                    return [
                        'id' => $view->getId(),
                        'type' => $view->getType(),
                        'name' => $view->getName(),
                        'configuration' => $view->getConfiguration(),
                    ];
                }, $views),
            ];
        }

        return [
            'id' => $module->getId(),
            'name' => $module->getName(),
            'technicalName' => $module->getTechnicalName(),
            'description' => $module->getDescription(),
            'version' => $module->getVersion(),
            'author' => $module->getAuthor(),
            'category' => $module->getCategory(),
            'isPublic' => $module->getIsPublic(),
            'models' => $modelsData,
        ];
    }

    // Genera el ZIP del módulo a través del servidor Java (misma lógica que ModuleController)
    private function generateZipFromJava(array $moduleData): ?string
    {
        $json = json_encode($moduleData, JSON_UNESCAPED_UNICODE);
        $host = $this->getParameter('java_server_host');
        $port = $this->getParameter('java_server_port');

        // Conexión TCP al servidor Java
        $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        if ($socket === false) {
            return null;
        }

        $result = @socket_connect($socket, $host, $port);
        if ($result === false) {
            socket_close($socket);
            return null;
        }

        $command = "GENERATE_MODULE;" . $json . "\n";
        socket_write($socket, $command, strlen($command));

        // Leer respuesta de control
        $control = '';
        while (($char = socket_read($socket, 1)) !== false && $char !== "\n" && $char !== "") {
            $control .= $char;
        }
        $control = trim($control);

        if ($control !== 'OK:ZIP') {
            socket_close($socket);
            return null;
        }

        // Leer tamaño del ZIP (4 bytes)
        $sizeData = socket_read($socket, 4);
        if ($sizeData === false || strlen($sizeData) < 4) {
            socket_close($socket);
            return null;
        }

        $size = unpack('N', $sizeData)[1];
        $zipData = '';
        $received = 0;

        while ($received < $size) {
            $chunk = socket_read($socket, min(8192, $size - $received));
            if ($chunk === false) break;
            $zipData .= $chunk;
            $received += strlen($chunk);
        }
        socket_close($socket);

        if (strlen($zipData) !== $size) {
            return null;
        }

        return $zipData;
    }

    // Extrae un ZIP en el directorio especificado (el directorio ya debe existir)
    private function extractZipToDirectory(string $zipData, string $targetPath): array
    {
        // Crear el directorio destino
        if (!@mkdir($targetPath, 0777, true) && !is_dir($targetPath)) {
            return ['success' => false, 'error' => 'Could not create target module directory'];
        }

        // Guardar ZIP temporal y extraer
        $tempZip = sys_get_temp_dir() . '/' . basename($targetPath) . '_' . uniqid() . '.zip';
        file_put_contents($tempZip, $zipData);

        $zip = new \ZipArchive();
        $result = $zip->open($tempZip);
        if ($result !== true) {
            @unlink($tempZip);
            $this->removeDirectory($targetPath);
            return ['success' => false, 'error' => 'Could not open ZIP file'];
        }

        $zip->extractTo($targetPath);
        $zip->close();
        @unlink($tempZip);

        // Verificar que se haya extraído correctamente
        if (!file_exists($targetPath . '/__manifest__.py')) {
            $this->removeDirectory($targetPath);
            return ['success' => false, 'error' => 'Invalid module: __manifest__.py not found in ZIP'];
        }

        return ['success' => true, 'path' => $targetPath];
    }

    // Restaura el backup renombrándolo de vuelta a su lugar original
    private function restoreBackup(string $backupPath, string $targetPath): void
    {
        if (!is_dir($backupPath)) {
            return;
        }
        rename($backupPath, $targetPath);
    }

    // ──────────────────────────────────────────────
    //  LIMPIEZA Y REGISTRO
    // ──────────────────────────────────────────────

    private function recordDeployment(Modules $module, string $status, string $log, $entityManager): void
    {
        try {
            $deployment = new Deployments();
            $deployment->setStatus($status);
            $deployment->setLog($log);
            $deployment->setModule($module);
            $entityManager->persist($deployment);
            $entityManager->flush();
        } catch (\Exception $e) {
            // Ignorar si falla
        }
    }

    private function removeDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $escapedDir = escapeshellarg($dir);
        shell_exec("rm -rf {$escapedDir} 2>&1");

        if (!is_dir($dir)) {
            return;
        }

        // Fallback con PHP
        try {
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::CHILD_FIRST
            );

            foreach ($iterator as $item) {
                if ($item->isDir()) {
                    @rmdir($item);
                } else {
                    @chmod($item, 0777);
                    @unlink($item);
                }
            }

            @rmdir($dir);
        } catch (\Exception $e) {
            // Ignorar
        }
    }
}
