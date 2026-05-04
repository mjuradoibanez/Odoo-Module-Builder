package generator;
import DTO.ModuleRequest;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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
        sb.append("    'name': '").append(module.name).append("',\n");
        sb.append("    'version': '").append(module.version).append("',\n");
        sb.append("    'author': '").append(module.author).append("',\n");
        sb.append("    'category': '").append(module.category).append("',\n");
        if (module.description != null && !module.description.equals("null") && !module.description.isEmpty()) {
            sb.append("    'description': '").append(module.description).append("',\n");
        }

        // Recopilar dependencias únicas de campos relacionales
        Set<String> depends = new HashSet<>();
        depends.add("base");
        String currentModule = module.technicalName;
        if (module.models != null) {
            for (DTO.ModuleRequest.ModelDTO model : module.models) {
                if (model.fields != null) {
                    for (DTO.ModuleRequest.FieldDTO field : model.fields) {
                        if (field.relationModule != null && !field.relationModule.isEmpty()
                            && !field.relationModule.equals(currentModule)
                            && !field.relationModule.equals("base")) {
                            depends.add(field.relationModule);
                        }
                    }
                }
            }
        }
        
        // Siempre incluir 'base' (ya añadido)
        sb.append("    'depends': [");
        boolean first = true;
        for (String dep : depends) {
            if (!first) sb.append(", ");
            sb.append("'").append(dep).append("'");
            first = false;
        }
        sb.append("],\n");

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
                String fname = field.technicalName.replaceAll("[\\s]+", "_");
                String fieldType = field.type.toLowerCase();
                boolean isRelation = fieldType.equals("many2one") || fieldType.equals("one2many") || fieldType.equals("many2many");
                sb.append("    ").append(fname).append(" = fields.");

                if (isRelation) {
                    String relModel = field.relationModel != null ? "'" + field.relationModel + "'" : "";
                    if (fieldType.equals("many2one")) {
                        sb.append("Many2one(").append(relModel);
                    } else if (fieldType.equals("one2many")) {
                        // Para one2many, relationModel debe ser el modelo hijo, relationField el campo inverso
                        String relField = field.relationField != null ? "'" + field.relationField + "'" : "";
                        sb.append("One2many(").append(relModel).append(", ").append(relField);
                    } else if (fieldType.equals("many2many")) {
                        sb.append("Many2many(").append(relModel);
                    }
                } else {
                    String pyFieldType = fieldType.substring(0,1).toUpperCase() + fieldType.substring(1);
                    sb.append(pyFieldType).append("(");
                }

                boolean hasPrev = isRelation && !fieldType.equals("one2many");
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
            // External id: model_<prefijo>_<nombre_modelo> (puntos y espacios pasan a guiones bajos)
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
        
        // 1. Todas las vistas de todos los modelos
        for (ModuleRequest.ModelDTO model : module.models) {
            String modelName = prefix + "." + model.technicalName.replaceAll("[\\s]+", "_");
            
            // Forzar list y form (siempre están)
            boolean hasList = false;
            boolean hasForm = false;
            if (model.views != null) {
                for (ModuleRequest.ViewDTO v : model.views) {
                    if ("list".equals(v.type)) hasList = true;
                    if ("form".equals(v.type)) hasForm = true;
                }
            }

            // Generar vista list
            if (!hasList) {
                sb.append("    <record id=\"view_" + model.technicalName + "_list\" model=\"ir.ui.view\">\n");
                sb.append("      <field name=\"name\">" + model.technicalName + ".list</field>\n");
                sb.append("      <field name=\"model\">" + modelName + "</field>\n");
                sb.append("      <field name=\"arch\" type=\"xml\">\n");
                sb.append("        <list>\n");
                for (ModuleRequest.FieldDTO field : model.fields) {
                    sb.append("          <field name=\"" + field.technicalName.replaceAll("[\\s]+", "_") + "\"/>\n");
                }
                sb.append("        </list>\n      </field>\n    </record>\n");
            }

            // Generar vista form
            if (!hasForm) {
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
            }

            // Generar vistas adicionales si existen (graph, kanban, calendar y search)
            if (model.views != null) {
                for (ModuleRequest.ViewDTO view : model.views) {
                    String vType = view.type.toLowerCase();
                    if (vType.equals("list") || vType.equals("form")) continue; // Ya añadidas

                    sb.append("    <record id=\"view_" + model.technicalName + "_" + vType + "\" model=\"ir.ui.view\">\n");
                    sb.append("      <field name=\"name\">" + model.technicalName + "." + vType + "</field>\n");
                    sb.append("      <field name=\"model\">" + modelName + "</field>\n");
                    sb.append("      <field name=\"arch\" type=\"xml\">\n");

                    if (vType.equals("search")) {
                        sb.append("        <search>\n");
                        if (view.configuration != null && view.configuration.get("fields") != null) {
                            java.util.List<String> searchFields = (java.util.List<String>) view.configuration.get("fields");
                            for (String f : searchFields) {
                                sb.append("          <field name=\"" + f + "\"/>\n");
                            }
                        } else {
                            // Por defecto primer campo
                            if (!model.fields.isEmpty()) {
                                sb.append("          <field name=\"" + model.fields.get(0).technicalName + "\"/>\n");
                            }
                        }
                        sb.append("        </search>\n");
                    } else if (vType.equals("kanban")) {
                        Object gb = (view.configuration != null) ? view.configuration.get("group_by") : null;
                        String groupBy = (gb != null) ? gb.toString() : null;

                        sb.append("        <kanban" + (groupBy != null && !groupBy.isEmpty() ? " default_group_by=\"" + groupBy + "\"" : "") + ">\n");
                        sb.append("          <templates>\n");
                        sb.append("            <t t-name=\"card\">\n");
                        sb.append("              <div class=\"oe_kanban_global_click\">\n");
                        sb.append("                <div class=\"oe_kanban_details\">\n");
                        sb.append("                  <strong class=\"o_kanban_record_title\">\n");
                        if (!model.fields.isEmpty()) {
                            sb.append("                    <field name=\"" + model.fields.get(0).technicalName + "\"/>\n");
                        }
                        sb.append("                  </strong>\n");
                        sb.append("                </div>\n");
                        sb.append("              </div>\n");
                        sb.append("            </t>\n");
                        sb.append("          </templates>\n");
                        sb.append("        </kanban>\n");

                    } else if (vType.equals("calendar")) {
                        Object ds = (view.configuration != null) ? view.configuration.get("date_start") : null;
                        Object dstop = (view.configuration != null) ? view.configuration.get("date_stop") : null;
                        Object col = (view.configuration != null) ? view.configuration.get("color") : null;
                        String dateStart = (ds != null) ? ds.toString() : "create_date";
                        String dateStop = (dstop != null) ? dstop.toString() : null;
                        String color = (col != null) ? col.toString() : null;
                        sb.append("        <calendar string=\"" + view.name + "\" date_start=\"" + dateStart + "\"");
                        if (dateStop != null && !dateStop.isEmpty()) sb.append(" date_stop=\"" + dateStop + "\"");
                        if (color != null && !color.isEmpty()) sb.append(" color=\"" + color + "\"");
                        sb.append(">\n");
                        if (!model.fields.isEmpty()) {
                            sb.append("          <field name=\"" + model.fields.get(0).technicalName + "\"/>\n");
                        }
                        sb.append("        </calendar>\n");

                    } else if (vType.equals("graph")) {
                        Object gt = (view.configuration != null) ? view.configuration.get("graph_type") : null;
                        String type = (gt != null) ? gt.toString() : "bar";
                        sb.append("        <graph string=\"" + view.name + "\" type=\"" + type + "\">\n");
                        if (view.configuration != null) {
                            Object row = view.configuration.get("row_field");
                            Object measure = view.configuration.get("measure_field");
                            if (row != null && !row.toString().isEmpty()) sb.append("          <field name=\"" + row.toString() + "\" type=\"row\"/>\n");
                            if (measure != null && !measure.toString().isEmpty()) sb.append("          <field name=\"" + measure.toString() + "\" type=\"measure\"/>\n");
                        }
                        sb.append("        </graph>\n");
                    }

                    sb.append("      </field>\n    </record>\n");
                }
            }
        }

        // 2. Todas las actions de todos los modelos
        for (ModuleRequest.ModelDTO model : module.models) {
            String modelName = prefix + "." + model.technicalName.replaceAll("[\\s]+", "_");
            sb.append("    <record id=\"action_" + model.technicalName + "\" model=\"ir.actions.act_window\">\n");
            sb.append("      <field name=\"name\">" + model.name + "</field>\n");
            sb.append("      <field name=\"res_model\">" + modelName + "</field>\n");
            
            StringBuilder modes = new StringBuilder("list,form");
            if (model.views != null) {
                for (ModuleRequest.ViewDTO v : model.views) {
                    String t = v.type.toLowerCase();
                    if (!t.equals("list") && !t.equals("form") && !t.equals("search")) {
                        modes.append(",").append(t);
                    }
                }
            }
            sb.append("      <field name=\"view_mode\">" + modes.toString() + "</field>\n");
            sb.append("    </record>\n");
        }

        // 3. Menú raíz
        sb.append("    <menuitem id=\"menu_root_" + prefix + "\" name=\"" + module.name + "\" sequence=\"1\"/>\n");

        // 4. Todos los menús hijos
        for (ModuleRequest.ModelDTO model : module.models) {
            sb.append("    <menuitem id=\"menu_" + model.technicalName + "\" name=\"" + model.name + "\" action=\"action_" + model.technicalName + "\" parent=\"menu_root_" + prefix + "\"/>\n");
        }

        sb.append("  </data>\n</odoo>\n");
        return sb.toString();
    }

    // Comprimir la carpeta en zip
    public static void zipFolder(File sourceDir, String zipFilePath) throws IOException {
        try (
            ZipOutputStream zs = new ZipOutputStream(new FileOutputStream(zipFilePath))
        ) {
            Path pp = sourceDir.toPath(); // Convierte la carpeta a Path
            Files.walk(pp) // Recorre todos los archivos
                .filter(path -> !Files.isDirectory(path))
                .forEach(path -> {
                    // Crea una entrada en el ZIP con la ruta relativa del archivo dentro de la carpeta
                    ZipEntry zipEntry = new ZipEntry(pp.relativize(path).toString());
                    // Escribe el archivo al ZIP
                    try {
                        zs.putNextEntry(zipEntry);
                        Files.copy(path, zs);
                        zs.closeEntry();
                    } catch (IOException e) {
                        System.err.println("Error zipping: " + path + " - " + e);
                    }
                }
            );
        }
    }
}
