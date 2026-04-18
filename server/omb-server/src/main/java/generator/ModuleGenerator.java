package generator;
import DTO.ModuleRequest;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

public class ModuleGenerator {
    public static File generateModuleWithThreads(ModuleRequest module) throws Exception {
        // Crear estructura de carpetas
        File root = new File(System.getProperty("java.io.tmpdir"), module.technicalName);
        root.mkdirs();
        File modelsDir = new File(root, "models");
        File securityDir = new File(root, "security");
        File viewsDir = new File(root, "views");
        modelsDir.mkdirs();
        securityDir.mkdirs();
        viewsDir.mkdirs();

        // Hilos para cada archivo principal
        Thread manifestThread = new Thread(() -> {
            try {
                writeFile(new File(root, "__manifest__.py"), generateManifest(module));
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
        Thread initThread = new Thread(() -> {
            try {
                writeFile(new File(root, "__init__.py"), "from . import models\n");
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
        Thread modelsInitThread = new Thread(() -> {
            try {
                writeFile(new File(modelsDir, "__init__.py"), "from . import models\n");
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
        Thread modelsThread = new Thread(() -> {
            try {
                writeFile(new File(modelsDir, "models.py"), generateModels(module));
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
        Thread viewsThread = new Thread(() -> {
            try {
                writeFile(new File(viewsDir, "views.xml"), generateViews(module));
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
        Thread securityThread = new Thread(() -> {
            try {
                writeFile(new File(securityDir, "ir.model.access.csv"), generateSecurity(module));
            } catch (IOException e) {
                e.printStackTrace();
            }
        });

        // Lanzar hilos
        manifestThread.start();
        initThread.start();
        modelsInitThread.start();
        modelsThread.start();
        viewsThread.start();
        securityThread.start();

        // Esperar a que terminen
        manifestThread.join();
        initThread.join();
        modelsInitThread.join();
        modelsThread.join();
        viewsThread.join();
        securityThread.join();

        return root;
    }

    // MÉTODOS:
    // Escribir archivos
    private static void writeFile(File file, String content) throws IOException {
        try (FileWriter writer = new FileWriter(file)) {
            writer.write(content);
        }
    }

    // Generar el contenido del manifest.py
    private static String generateManifest(ModuleRequest module) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("    'name': '").append(module.technicalName).append("',\n");
        sb.append("    'version': '").append(module.version).append("',\n");
        sb.append("    'author': '").append(module.author).append("',\n");
        sb.append("    'category': '").append(module.category).append("',\n");
        if (module.description != null && !module.description.equals("null") && !module.description.isEmpty()) {
            sb.append("    'description': '").append(module.description).append("',\n");
        }
        sb.append("    'depends': ['base'],\n");
        sb.append("    'data': [\n");
        sb.append("        'security/ir.model.access.csv',\n");
        sb.append("        'views/views.xml'\n");
        sb.append("    ],\n");
        sb.append("    'installable': True,\n");
        sb.append("    'application': True\n");
        sb.append("}");
        return sb.toString();
    }

    // Generar el contenido de los modelos
    private static String generateModels(ModuleRequest module) {
        StringBuilder sb = new StringBuilder();
        sb.append("from odoo import models, fields, api, exceptions\n\n");
        String prefix = module.technicalName.replaceAll("[\\s]+", "_");
        for (ModuleRequest.ModelDTO model : module.models) {
            String className = capitalize(model.technicalName.replaceAll("[\\s]+", "_"));
            String modelName = prefix + "." + model.technicalName.replaceAll("[\\s]+", "_");
            sb.append("class ").append(className).append("(models.Model):\n");
            sb.append("    _name = '").append(modelName).append("'\n");
            sb.append("    _description = '").append(model.name).append("'\n");
            for (ModuleRequest.FieldDTO field : model.fields) {
                String fieldType = field.type.substring(0,1).toUpperCase() + field.type.substring(1).toLowerCase();
                sb.append("    ").append(field.technicalName.replaceAll("[\\s]+", "_")).append(" = fields.").append(fieldType).append("(");
                boolean hasPrev = false;
                if (field.relationModel != null && !field.relationModel.isEmpty()) {
                    sb.append("'" + field.relationModel + "'");
                    hasPrev = true;
                }
                if (field.required) {
                    if (hasPrev) sb.append(", ");
                    sb.append("required=True");
                    hasPrev = true;
                }
                sb.append(")\n");
            }

            // Añadir métodos @api.constrains para campos únicos
            for (ModuleRequest.FieldDTO field : model.fields) {
                if (field.unique) {
                    String fname = field.technicalName.replaceAll("[\\s]+", "_");
                    sb.append("    @api.constrains('" + fname + "')\n");
                    sb.append("    def _check_unique_" + fname + "(self):\n");
                    sb.append("        for record in self:\n");
                    sb.append("            domain = [('" + fname + "', '=', record." + fname + "), ('id', '!=', record.id)]\n");
                    sb.append("            count = self.search_count(domain)\n");
                    sb.append("            if count > 0:\n");
                    sb.append("                raise exceptions.ValidationError('¡Error! Ya existe un registro con el valor único en " + fname + "')\n");
                    sb.append("\n");
                }
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    // Capitaliza la primera letra de cada parte separada por _ (CamelCase simple)
    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        String[] parts = s.split("_");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (!part.isEmpty()) {
                sb.append(part.substring(0,1).toUpperCase()).append(part.substring(1));
            }
        }
        return sb.toString();
    }

    // Generar el contenido de la seguridad
    private static String generateSecurity(ModuleRequest module) {
        StringBuilder sb = new StringBuilder();
        sb.append("id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink\n");
        String prefix = module.technicalName.replaceAll("[\\s]+", "_");
        for (ModuleRequest.ModelDTO model : module.models) {
            String modelName = prefix + "." + model.technicalName.replaceAll("[\\s]+", "_");
            // External id: model_<prefijo>_<nombre_modelo> (puntos y espacios a guiones bajos)
            String externalId = "model_" + modelName.replaceAll("[. ]+", "_");
            sb.append("access_").append(model.technicalName).append(",");
            sb.append(modelName).append(",");
            sb.append(externalId).append(",base.group_user,");
            sb.append("1,1,1,1\n");
        }
        return sb.toString();
    }

    // Generar el contenido de las vistas
    private static String generateViews(ModuleRequest module) {
        StringBuilder sb = new StringBuilder();
        sb.append("<odoo>\n  <data>\n");
        String prefix = module.technicalName.replaceAll("[\\s]+", "_");
        sb.append("    <menuitem id=\"menu_root_" + prefix + "\" name=\"" + module.name + "\" sequence=\"1\"/>\n");
        for (ModuleRequest.ModelDTO model : module.models) {
            String modelName = prefix + "." + model.technicalName.replaceAll("[\\s]+", "_");
            // Vista list
            sb.append("    <record id=\"view_" + model.technicalName + "_list\" model=\"ir.ui.view\">\n");
            sb.append("      <field name=\"name\">" + model.technicalName + ".list</field>\n");
            sb.append("      <field name=\"model\">" + modelName + "</field>\n");
            sb.append("      <field name=\"arch\" type=\"xml\">\n");
            sb.append("        <list>\n");
            for (ModuleRequest.FieldDTO field : model.fields) {
                sb.append("          <field name=\"" + field.technicalName.replaceAll("[\\s]+", "_") + "\"/>\n");
            }
            sb.append("        </list>\n      </field>\n    </record>\n");
            // Vista form
            sb.append("    <record id=\"view_" + model.technicalName + "_form\" model=\"ir.ui.view\">\n");
            sb.append("      <field name=\"name\">" + model.technicalName + ".form</field>\n");
            sb.append("      <field name=\"model\">" + modelName + "</field>\n");
            sb.append("      <field name=\"arch\" type=\"xml\">\n");
            sb.append("        <form>\n");
            sb.append("          <group>\n");
            for (ModuleRequest.FieldDTO field : model.fields) {
                sb.append("            <field name=\"" + field.technicalName.replaceAll("[\\s]+", "_") + "\"");
                if (field.required) {
                    sb.append(" required=\"1\"");
                }
                sb.append("/>\n");
            }
            sb.append("          </group>\n");
            sb.append("        </form>\n      </field>\n    </record>\n");

            // Acción window para el modelo
            sb.append("    <record id=\"action_" + model.technicalName + "\" model=\"ir.actions.act_window\">\n");
            sb.append("      <field name=\"name\">" + model.name + "</field>\n");
            sb.append("      <field name=\"res_model\">" + modelName + "</field>\n");
            sb.append("      <field name=\"view_mode\">list,form</field>\n");
            sb.append("    </record>\n");

            // Menú para el modelo
            sb.append("    <menuitem id=\"menu_" + model.technicalName + "\" name=\"" + model.name + "\" action=\"action_" + model.technicalName + "\" parent=\"menu_root_" + prefix + "\"/>\n");
        }
        sb.append("  </data>\n</odoo>\n");
        return sb.toString();
    }

    // Comprimir la carpeta en zip
    private static void zipFolder(File sourceDir, String zipFilePath) throws IOException {
        try (java.util.zip.ZipOutputStream zs = new java.util.zip.ZipOutputStream(new java.io.FileOutputStream(zipFilePath))) {
            java.nio.file.Path pp = sourceDir.toPath();
            java.nio.file.Files.walk(pp)
                    .filter(path -> !java.nio.file.Files.isDirectory(path))
                    .forEach(path -> {
                        java.util.zip.ZipEntry zipEntry = new java.util.zip.ZipEntry(pp.relativize(path).toString());
                        try {
                            zs.putNextEntry(zipEntry);
                            java.nio.file.Files.copy(path, zs);
                            zs.closeEntry();
                        } catch (IOException e) {
                            System.err.println("Error zipping: " + path + " - " + e);
                        }
                    });
        }
    }

    // Main de prueba
    public static void main(String[] args) throws Exception {
        String json = """
{
    "id": 1,
    "name": "Academia",
    "technicalName": "academia",
    "description": null,
    "version": "1.0",
    "author": "Admin",
    "createdAt": "2026-04-17T07:53:48+02:00",
    "category": "educacion",
    "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@omb.com"
    },
    "models": [
        {
            "id": 1,
            "name": "Alumno",
            "technicalName": "alumno",
            "fields": [
                {
                    "id": 1,
                    "name": "Nombre",
                    "technicalName": "nombre",
                    "type": "char",
                    "required": true,
                    "unique": true,
                    "relationModel": null
                },
                {
                    "id": 2,
                    "name": "Edad",
                    "technicalName": "edad",
                    "type": "integer",
                    "required": false,
                    "unique": false,
                    "relationModel": null
                }
            ],
            "views": [
                {"id": 1, "type": "list", "name": "alumno_list"},
                {"id": 2, "type": "form", "name": "alumno_form"}
            ]
        },
        {
            "id": 2,
            "name": "Curso",
            "technicalName": "curso",
            "fields": [
                {
                    "id": 3,
                    "name": "Titulo",
                    "technicalName": "titulo",
                    "type": "char",
                    "required": true,
                    "unique": true,
                    "relationModel": null
                },
                {
                    "id": 4,
                    "name": "Descripcion",
                    "technicalName": "descripcion",
                    "type": "text",
                    "required": false,
                    "unique": false,
                    "relationModel": null
                }
            ],
            "views": [
                {"id": 3, "type": "list", "name": "curso_list"},
                {"id": 4, "type": "form", "name": "curso_form"}
            ]
        }
    ]
}
        """;
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        DTO.ModuleRequest module = mapper.readValue(json, DTO.ModuleRequest.class);
        File result = generateModuleWithThreads(module);
        
        // Comprimir la carpeta generada en un zip
        String zipPath = result.getAbsolutePath() + ".zip";
        zipFolder(result, zipPath);
        System.out.println("Módulo generado y comprimido en: " + zipPath);
        

    }
}
