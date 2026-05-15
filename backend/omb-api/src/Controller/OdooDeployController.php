<?php

namespace App\Controller;

use App\Entity\Deployments;
use App\Entity\Modules;
use App\Entity\Models;
use App\Entity\Fields;
use App\Entity\Views;
use App\Helper\OdooErrorParser;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
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

        try {
            // 2. Construir el JSON completo del módulo
            $moduleData = $this->buildModuleFullData($module, $entityManager);

            // 3. Generar el ZIP a través del servidor Java
            $zipData = $this->generateZipFromJava($moduleData);
            if ($zipData === null) {
                return $this->json(['success' => false, 'error' => 'Failed to generate module ZIP'], 500);
            }

            // 4. Desplegar los archivos en Odoo usando docker exec (evita problemas de permisos)
            $deployResult = $this->deployModuleFilesViaDocker($zipData, $technicalName, $targetPath);
            if ($deployResult['success'] === false) {
                return $this->json(['success' => false, 'error' => $deployResult['error']], 500);
            }

            // 5. Instalar (o actualizar) el módulo en Odoo
            $installResult = $this->installOrUpgradeModuleInOdoo($technicalName);

            // 6. Si hay error en la instalación
            if (!$installResult['success']) {
                $errorMsg = $installResult['error'] ?? 'Unknown error during installation';
                $this->recordDeployment($module, 'error', $errorMsg, $entityManager);

                // Intentar dar un mensaje más descriptivo analizando el error
                $parsedError = OdooErrorParser::parse($errorMsg);

                return $this->json([
                    'success' => false,
                    'error' => $parsedError,
                    'log' => $installResult['log'] ?? $errorMsg,
                ], 500);
            }

            // 7. Éxito
            $successMsg = "Module '{$technicalName}' deployed and installed successfully in Odoo";
            $this->recordDeployment($module, 'success', $successMsg, $entityManager);

            return $this->json([
                'success' => true,
                'message' => $successMsg,
            ]);
        } catch (\Exception $e) {
            $errorMsg = 'Unexpected error: ' . $e->getMessage();
            $this->recordDeployment($module, 'error', $errorMsg, $entityManager);

            return $this->json([
                'success' => false,
                'error' => $errorMsg,
            ], 500);
        }
    }

    // ──────────────────────────────────────────────
    //  DESPLIEGUE DE ARCHIVOS
    // ──────────────────────────────────────────────

    // Extrae el ZIP directamente desde PHP al volumen compartido
    private function deployModuleFilesViaDocker(string $zipData, string $technicalName, string $targetPath): array
    {
        // 1. Eliminar el directorio antiguo del módulo si existe
        $this->removeDirectory($targetPath);

        // 2. Guardar el ZIP temporalmente
        $tempZip = sys_get_temp_dir() . '/' . $technicalName . '_' . uniqid() . '.zip';
        file_put_contents($tempZip, $zipData);

        // 3. Extraer el ZIP directamente en el directorio destino
        $zip = new \ZipArchive();
        if ($zip->open($tempZip) !== true) {
            @unlink($tempZip);
            return ['success' => false, 'error' => 'Could not open ZIP file'];
        }

        // Asegurarse de que el directorio destino existe
        if (!is_dir($targetPath)) {
            @mkdir($targetPath, 0777, true);
        }

        $zip->extractTo($targetPath);
        $zip->close();
        @unlink($tempZip);

        // 4. Verificar que el manifiesto existe
        if (!file_exists($targetPath . '/__manifest__.py')) {
            $this->removeDirectory($targetPath);
            return ['success' => false, 'error' => 'Invalid module: __manifest__.py not found in ZIP'];
        }

        return ['success' => true, 'path' => $targetPath];
    }

    // Elimina un directorio recursivamente usando rm -rf
    private function removeDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        exec('rm -rf ' . escapeshellarg($dir) . ' 2>&1', $_, $code);
        if ($code !== 0) {
            // Fallback a PHP si rm falla
            $it = new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS);
            $files = new \RecursiveIteratorIterator($it, \RecursiveIteratorIterator::CHILD_FIRST);
            foreach ($files as $file) {
                if ($file->isDir()) {
                    @rmdir($file->getRealPath());
                } else {
                    @unlink($file->getRealPath());
                }
            }
            @rmdir($dir);
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
                usleep(500000);
                $moduleInfo = $this->findModule($baseUrl, $uid, $odooDb, $odooPassword, $technicalName);
            }

            // Si sigue sin aparecer, error
            if ($moduleInfo === null) {
                return [
                    'success' => false,
                    'error' => "Module '{$technicalName}' not found in Odoo even after update_list. Check that the module files are correctly placed in the addons directory.",
                ];
            }

            $moduleId = $moduleInfo['id'];
            $state = $moduleInfo['state'];

            if ($state === 'uninstalled') {
                return $this->odooInstallModule($baseUrl, $uid, $odooDb, $odooPassword, $moduleId, $technicalName);
            } elseif ($state === 'installed' || $state === 'to upgrade') {
                $upgradeResult = $this->odooUpgradeModule($baseUrl, $uid, $odooDb, $odooPassword, $moduleId, $technicalName);
                if ($upgradeResult['success']) {
                    return $upgradeResult;
                }
                return $this->odooReinstallModule($baseUrl, $uid, $odooDb, $odooPassword, $moduleId, $technicalName);
            } else {
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

            // El UID debe ser un número entero positivo
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

        usleep(500000);

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
                        'relationModule' => (in_array($field->getType(), ['many2one', 'one2many', 'many2many']) && $field->getRelationModule()) ? $field->getRelationModule() : null,
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

        $control = '';
        while (($char = socket_read($socket, 1)) !== false && $char !== "\n" && $char !== "") {
            $control .= $char;
        }
        $control = trim($control);

        if ($control !== 'OK:ZIP') {
            socket_close($socket);
            return null;
        }

        $sizeData = socket_read($socket, 4);
        if ($sizeData === false || strlen($sizeData) < 4) {
            socket_close($socket);
            return null;
        }

        $size = unpack('N', $sizeData)[1];

        // Si el tamaño es 0, el ZIP está vacío
        if ($size === 0) {
            socket_close($socket);
            return null;
        }

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

    // ──────────────────────────────────────────────
    //  REGISTRO
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
}
