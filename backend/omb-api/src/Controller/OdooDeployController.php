<?php

namespace App\Controller;

use App\Entity\Deployments;
use App\Entity\Modules;
use App\Entity\Models;
use App\Entity\Fields;
use App\Entity\Views;
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

    // Endpoint principal: genera el módulo, lo copia a Odoo, lo instala y verifica
    public function deployToOdoo(Request $request, SerializerInterface $serializer)
    {
        $moduleId = $request->get('id');
        $entityManager = $this->getDoctrine()->getManager();

        // 1. Obtener el módulo completo de la BD
        $module = $entityManager
            ->getRepository(Modules::class)
            ->find($moduleId);

        if (!$module) {
            return $this->json(['success' => false, 'error' => 'Module not found'], 404);
        }

        // 2. Construir el JSON completo del módulo (igual que module_full)
        $moduleData = $this->buildModuleFullData($module, $entityManager);

        // 3. Generar el ZIP a través del servidor Java
        $zipData = $this->generateZipFromJava($moduleData);
        if ($zipData === null) {
            return $this->json(['success' => false, 'error' => 'Failed to generate module ZIP'], 500);
        }

        $technicalName = $module->getTechnicalName();

        // 4. Extraer el ZIP directamente en la carpeta addons de Odoo
        $extractResult = $this->extractZipToOdooAddons($zipData, $technicalName);
        if ($extractResult['success'] === false) {
            return $this->json(['success' => false, 'error' => $extractResult['error']], 500);
        }

        $addonsPath = $extractResult['path'];

        // 5. Instalar el módulo en Odoo por API
        $installResult = $this->installModuleInOdoo($technicalName);
        
        // 6. Verificar logs de Odoo para confirmar instalación
        $logCheck = $this->checkOdooLogs($technicalName);

        // 7. Si hay error, eliminar carpeta del módulo y registrar el error
        if (!$installResult['success'] || !$logCheck['success']) {
            $this->rollbackModule($addonsPath);
            
            $errorMsg = $installResult['error'] ?? $logCheck['error'] ?? 'Unknown error during installation';
            
            // Registrar el deployment fallido
            $this->recordDeployment($module, 'error', $errorMsg, $entityManager);
            
            return $this->json([
                'success' => false,
                'error' => $errorMsg,
                'log' => $logCheck['log'] ?? '',
            ], 500);
        }

        // 8. Éxito - registrar deployment
        $successLog = "Module '{$technicalName}' deployed and installed successfully.\n" . ($logCheck['log'] ?? '');
        $this->recordDeployment($module, 'success', $successLog, $entityManager);

        return $this->json([
            'success' => true,
            'message' => "Module '{$technicalName}' deployed and installed successfully in Odoo",
            'log' => $logCheck['log'] ?? '',
        ]);
    }

    // Construye los datos completos del módulo (modelos, campos, vistas)
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
                    $fieldData = [
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
                    return $fieldData;
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

        // Leer el ZIP en fragmentos hasta recibir todo
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

    // Extrae el ZIP a una carpeta temporal y luego lo mueve a la carpeta addons de Odoo
    private function extractZipToOdooAddons(string $zipData, string $technicalName): array
    {
        $addonsPath = $this->getParameter('odoo_addons_path');
        $targetPath = $addonsPath . '/' . $technicalName;

        // Si ya existe el módulo en Odoo, eliminarlo primero (para actualizar)
        if (is_dir($targetPath)) {
            $this->removeDirectory($targetPath);
        }

        // Crear el directorio destino
        if (!mkdir($targetPath, 0777, true)) {
            return ['success' => false, 'error' => 'Could not create target module directory'];
        }

        // Guardar ZIP a archivo temporal y extraer
        $tempZip = sys_get_temp_dir() . '/' . $technicalName . '_' . uniqid() . '.zip';
        file_put_contents($tempZip, $zipData);

        $zip = new \ZipArchive();
        $result = $zip->open($tempZip);
        if ($result !== true) {
            // unlink para eliminar el archivo temporal
            @unlink($tempZip);
            $this->removeDirectory($targetPath);
            return ['success' => false, 'error' => 'Could not open ZIP file'];
        }

        $zip->extractTo($targetPath);
        $zip->close();
        @unlink($tempZip);

        // Verificar que se haya extraído correctamente (debe existir __manifest__.py)
        if (!file_exists($targetPath . '/__manifest__.py')) {
            $this->removeDirectory($targetPath);
            return ['success' => false, 'error' => 'Invalid module: __manifest__.py not found in ZIP'];
        }

        return ['success' => true, 'path' => $targetPath];
    }


    // Instala el módulo en Odoo usando la API XML-RPC o HTTP
    private function installModuleInOdoo(string $technicalName): array
    {
        $odooHost = $this->getParameter('odoo_host');
        $odooPort = $this->getParameter('odoo_port');
        $odooDb = $this->getParameter('odoo_db');
        $odooUser = $this->getParameter('odoo_user');
        $odooPassword = $this->getParameter('odoo_password');

        // Odoo 19 tiene una API JSON-RPC en /jsonrpc
        $baseUrl = "http://{$odooHost}:{$odooPort}";

        try {
            // Paso 1: Autenticarse en Odoo (login estándar de Odoo)
            $authResponse = $this->httpClient->request('POST', $baseUrl . '/jsonrpc', [
                'json' => [
                    'jsonrpc' => '2.0',
                    'method' => 'call',
                    'params' => [
                        'service' => 'common',
                        'method' => 'login',
                        'args' => [
                            $odooDb,
                            $odooUser,
                            $odooPassword,
                        ],
                    ],
                    'id' => 1,
                ],
                'timeout' => 10,
            ]);

            // Odoo responde el id del usuario autenticado
            $authData = json_decode($authResponse->getContent(), true);
            $uid = $authData['result'] ?? null;

            if (!$uid || !is_numeric($uid)) {
                // Si la API no funciona, instala con Docker
                return $this->installModuleViaOdooBin($technicalName);
            }

            // Paso 2: Llamar al método button_immediate_install del módulo
            // Buscamos el módulo por nombre técnico
            $searchResponse = $this->httpClient->request('POST', $baseUrl . '/jsonrpc', [
                'json' => [
                    'jsonrpc' => '2.0',
                    'method' => 'call',
                    'params' => [
                        'service' => 'object',
                        'method' => 'execute_kw',
                        'args' => [
                            $odooDb,
                            $uid,
                            $odooPassword,
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

            // Odoo devuelte el id, el nombre y el estado del modulo
            $searchData = json_decode($searchResponse->getContent(), true);
            $modules = $searchData['result'] ?? [];

            if (empty($modules)) {
                // Si no encuentra el módulo, actualizamos la lista de módulos
                $this->updateModuleList($baseUrl, $uid, $odooDb, $odooPassword);

                // Buscar de nuevo
                $searchResponse = $this->httpClient->request('POST', $baseUrl . '/jsonrpc', [
                    'json' => [
                        'jsonrpc' => '2.0',
                        'method' => 'call',
                        'params' => [
                            'service' => 'object',
                            'method' => 'execute_kw',
                            'args' => [
                                $odooDb,
                                $uid,
                                $odooPassword,
                                'ir.module.module',
                                'search_read',
                                [
                                    [['name', '=', $technicalName]],
                                ],
                                ['fields' => ['id', 'name', 'state'], 'limit' => 1],
                            ],
                        ],
                        'id' => 3,
                    ],
                    'timeout' => 10,
                ]);

                $searchData = json_decode($searchResponse->getContent(), true);
                $modules = $searchData['result'] ?? [];

                // Si sigue sin encontrar el módulo, devuelve el error
                if (empty($modules)) {
                    return ['success' => false, 'error' => "Module '{$technicalName}' not found in Odoo module list even after update"];
                }
            }

            // Si encuentra el módulo, obtenemos su id y estado
            $moduleInfo = $modules[0];
            $moduleId = $moduleInfo['id'];
            $state = $moduleInfo['state'];

            // Paso 3: Instalar el módulo
            if ($state === 'uninstalled') {
                $installResponse = $this->httpClient->request('POST', $baseUrl . '/jsonrpc', [
                    'json' => [
                        'jsonrpc' => '2.0',
                        'method' => 'call',
                        'params' => [
                            'service' => 'object',
                            'method' => 'execute_kw',
                            'args' => [
                                $odooDb,
                                $uid,
                                $odooPassword,
                                'ir.module.module',
                                'button_immediate_install',
                                [[$moduleId]],
                            ],
                        ],
                        'id' => 4,
                    ],
                    'timeout' => 120, // La instalación puede tardar
                ]);

                $installData = json_decode($installResponse->getContent(), true);
                if (isset($installData['error'])) {
                    return ['success' => false, 'error' => 'Odoo install error: ' . ($installData['error']['message'] ?? json_encode($installData['error']))];
                }
            
            // Si ya está instalado, hacer upgrade
            } elseif ($state === 'installed' || $state === 'to upgrade') {
                $upgradeResponse = $this->httpClient->request('POST', $baseUrl . '/jsonrpc', [
                    'json' => [
                        'jsonrpc' => '2.0',
                        'method' => 'call',
                        'params' => [
                            'service' => 'object',
                            'method' => 'execute_kw',
                            'args' => [
                                $odooDb,
                                $uid,
                                $odooPassword,
                                'ir.module.module',
                                'button_immediate_upgrade',
                                [[$moduleId]],
                            ],
                        ],
                        'id' => 5,
                    ],
                    'timeout' => 120,
                ]);

                $upgradeData = json_decode($upgradeResponse->getContent(), true);
                if (isset($upgradeData['error'])) {
                    return ['success' => false, 'error' => 'Odoo upgrade error: ' . ($upgradeData['error']['message'] ?? json_encode($upgradeData['error']))];
                }
            }

            return ['success' => true];

        } catch (\Exception $e) {
            // Si falla la conexión HTTP, intentar con odoo-bin
            return $this->installModuleViaOdooBin($technicalName);
        }
    }

    // Actualiza la lista de módulos en Odoo para que aparezca el nuevo
    private function updateModuleList(string $baseUrl, $uid, string $odooDb, string $odooPassword): void
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
                            $odooDb,
                            $uid,
                            $odooPassword,
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
            // Ignorar errores de actualización de lista
        }
    }

    // Método alternativo: instalar módulo usando odoo-bin dentro del contenedor Docker
    private function installModuleViaOdooBin(string $technicalName): array
    {
        try {
            // Ejecutar odoo-bin dentro del contenedor Docker para instalar el módulo
            $command = sprintf(
                'docker exec omb_odoo odoo-bin -d %s -u %s --stop-after-init --addons-path=/mnt/extra-addons 2>&1',
                escapeshellarg($this->getParameter('odoo_db')),
                escapeshellarg($technicalName)
            );

            $output = shell_exec($command);

            // Verificar si la instalación fue exitosa
            if ($output === null) {
                return ['success' => false, 'error' => 'Failed to execute odoo-bin command'];
            }

            // Buscar errores en la salida
            if (preg_match('/ERROR.*' . preg_quote($technicalName, '/') . '/i', $output) ||
                preg_match('/Module.*' . preg_quote($technicalName, '/') . '.*not found/i', $output) ||
                strpos($output, 'Traceback') !== false) {
                return ['success' => false, 'error' => 'Odoo installation error', 'log' => substr($output, -2000)];
            }

            // Verificar que se haya instalado correctamente
            if (strpos($output, "module {$technicalName}: module loaded") !== false ||
                strpos($output, "Modules loaded") !== false) {
                return ['success' => true, 'log' => substr($output, -2000)];
            }

            return ['success' => true, 'log' => substr($output, -2000)];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => 'Exception: ' . $e->getMessage()];
        }
    }

    // Verifica los logs de Odoo para confirmar que el módulo se instaló correctamente
    private function checkOdooLogs(string $technicalName): array
    {
        try {
            // Leer logs del contenedor de Odoo
            $command = sprintf(
                'docker logs omb_odoo --tail 100 2>&1 | grep -i "%s" || true',
                escapeshellarg($technicalName)
            );

            $output = shell_exec($command);

            if ($output === null || trim($output) === '') {
                // No hay logs específicos del módulo, puede que esté bien
                return ['success' => true, 'log' => 'No specific errors found in Odoo logs'];
            }

            // Buscar errores en los logs
            if (preg_match('/ERROR|CRITICAL|WARNING.*' . preg_quote($technicalName, '/') . '/i', $output)) {
                return ['success' => false, 'error' => 'Errors found in Odoo logs', 'log' => $output];
            }

            return ['success' => true, 'log' => $output];

        } catch (\Exception $e) {
            // Si no podemos leer logs, asumimos que fue bien
            return ['success' => true, 'log' => 'Could not read Odoo logs, but installation completed'];
        }
    }

    // Rollback: elimina la carpeta del módulo de Odoo addons
    private function rollbackModule(string $modulePath): void
    {
        if (is_dir($modulePath)) {
            $this->removeDirectory($modulePath);
        }
    }

    // Registra un deployment en la base de datos
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
 
    // Elimina un directorio y todo su contenido (archivos y subdirectorios)
    private function removeDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($iterator as $item) {
            if ($item->isDir()) {
                rmdir($item);
            } else {
                unlink($item);
            }
        }

        rmdir($dir);
    }
}
