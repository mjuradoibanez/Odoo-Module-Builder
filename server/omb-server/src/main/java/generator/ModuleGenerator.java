package generator;
import DTO.ModuleRequest;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
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
        String author = (module.author != null) ? module.author : "Admin";
        sb.append("    'author': '").append(author).append("',\n");
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
        sb.append("from odoo import models, fields, api\n");
        sb.append("from odoo.exceptions import ValidationError\n");
        sb.append("from datetime import timedelta\n\n");
        String prefix = module.technicalName.replaceAll("[\\s]+", "_");

        for (ModuleRequest.ModelDTO model : module.models) {
            String className = capitalize(model.technicalName.replaceAll("[\\s]+", "_"));
            String modelName = prefix + "." + model.technicalName.replaceAll("[\\s]+", "_");
            sb.append("class ").append(className).append("(models.Model):\n");
            sb.append("    _name = '").append(modelName).append("'\n");
            sb.append("    _description = '").append(model.name).append("'\n");

            // Determinar el campo para _rec_name (por defecto 'name', si no el primero disponible)
            if (!model.fields.isEmpty()) {
                boolean hasNameField = model.fields.stream().anyMatch(f -> "name".equals(f.technicalName.toLowerCase()));
                if (!hasNameField) {
                    String firstFieldName = model.fields.get(0).technicalName.replaceAll("[\\s]+", "_");
                    sb.append("    _rec_name = '").append(firstFieldName).append("'\n");
                }
            }
            sb.append("\n");
            
            for (ModuleRequest.FieldDTO field : model.fields) {
                String fname = getSafeFieldName(field.technicalName);
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
                } else if (fieldType.equals("selection")) {
                    sb.append("Selection([\n");
                    if (field.selectionOptions != null) {
                        for (Map<String, String> opt : field.selectionOptions) {
                            sb.append("        ('").append(opt.get("key")).append("', '").append(opt.get("label")).append("'),\n");
                        }
                    }
                    sb.append("    ]");
                } else {
                    String pyFieldType = fieldType.substring(0,1).toUpperCase() + fieldType.substring(1);
                    sb.append(pyFieldType).append("(");
                }

                // Ver si ya hay contenido dentro del paréntesis para poner o no una coma
                boolean hasPrev = (isRelation && field.relationModel != null && !field.relationModel.isEmpty()) || fieldType.equals("selection");

                // Añadimos siempre el atributo string
                if (hasPrev) sb.append(", ");
                sb.append("string='").append(field.name).append("'");
                hasPrev = true;

                if (field.required) {
                    if (hasPrev) sb.append(", ");
                    sb.append("required=True");
                    hasPrev = true;
                }
                if (field.defaultValue != null && !field.defaultValue.isEmpty() && !isRelation) {
                    if (hasPrev) sb.append(", ");
                    sb.append("default=");
                    if (fieldType.equals("boolean")) {
                        sb.append(field.defaultValue.toLowerCase().equals("true") ? "True" : "False");
                    } else if (fieldType.equals("integer") || fieldType.equals("float") || fieldType.equals("monetary")) {
                        sb.append(field.defaultValue);
                    } else if (field.defaultValue.equals("__now__") && fieldType.equals("datetime")) {
                        sb.append("lambda self: fields.Datetime.now()");
                    } else {
                        sb.append("'").append(field.defaultValue).append("'");
                    }
                    hasPrev = true;
                }
                // Campo computado (integer con regla 'computed')
                if (field.rules != null) {
                    Map<String, Object> computedRule = null;
                    for (Map<String, Object> rule : field.rules) {
                        if ("computed".equals(rule.get("type"))) {
                            computedRule = rule;
                            break;
                        }
                    }
                    if (computedRule != null) {
                        String computeMethod = computedRule.get("computeMethod") != null ? computedRule.get("computeMethod").toString() : "_compute_" + fname;
                        if (hasPrev) sb.append(", ");
                        sb.append("compute='").append(computeMethod).append("'");
                        hasPrev = true;
                        boolean store = computedRule.get("store") == null || Boolean.TRUE.equals(computedRule.get("store"));
                        if (store) {
                            if (hasPrev) sb.append(", ");
                            sb.append("store=True");
                            hasPrev = true;
                            // Añadir group_operator='sum' para campos computados almacenados (necesario para gráficos)
                            if (hasPrev) sb.append(", ");
                            sb.append("group_operator='sum'");
                            hasPrev = true;
                        } else {
                            if (hasPrev) sb.append(", ");
                            sb.append("store=False");
                            hasPrev = true;
                        }
                    }
                }
                sb.append(")\n");
                
            }

            // Añadir métodos compute para campos computados
            for (ModuleRequest.FieldDTO field : model.fields) {
                if (field.rules != null) {
                    Map<String, Object> computedRule = null;
                    for (Map<String, Object> rule : field.rules) {
                        if ("computed".equals(rule.get("type"))) {
                            computedRule = rule;
                            break;
                        }
                    }
                    if (computedRule != null) {
                        String fname = getSafeFieldName(field.technicalName);
                        String computeMethod = computedRule.get("computeMethod") != null ? computedRule.get("computeMethod").toString() : "_compute_" + fname;
                        @SuppressWarnings("unchecked")
                        List<String> depends = (List<String>) computedRule.get("depends");
                        
                        // @api.depends
                        sb.append("    @api.depends(");
                        if (depends != null && !depends.isEmpty()) {
                            for (int i = 0; i < depends.size(); i++) {
                                if (i > 0) sb.append(", ");
                                sb.append("'").append(depends.get(i)).append("'");
                            }
                        }
                        sb.append(")\n");
                        
                        // Método compute: cuenta registros de la relación one2many/many2many
                        sb.append("    def ").append(computeMethod).append("(self):\n");
                        sb.append("        for record in self:\n");
                        if (depends != null && !depends.isEmpty()) {
                            sb.append("            record.").append(fname).append(" = len(record.").append(depends.get(0)).append(")\n");
                        } else {
                            sb.append("            record.").append(fname).append(" = 0\n");
                        }
                        sb.append("\n");
                    }
                }
            }

            // Añadir métodos @api.constrains
            // 1. Unicidad
            for (ModuleRequest.FieldDTO field : model.fields) {
                if (field.unique) {
                    String fname = getSafeFieldName(field.technicalName);
                    sb.append("    @api.constrains('" + fname + "')\n");
                    sb.append("    def _check_unique_" + fname + "(self):\n");
                    sb.append("        for record in self:\n");
                    sb.append("            domain = [('" + fname + "', '=', record." + fname + "), ('id', '!=', record.id)]\n");
                    sb.append("            count = self.search_count(domain)\n");
                    sb.append("            if count > 0:\n");
                    sb.append("                raise ValidationError('¡Error! Ya existe un registro con el valor único en " + field.name + "')\n");
                    sb.append("\n");
                }
            }

            // 2. Restricciones (Constraints) - recorremos campos y sus reglas directamente
            boolean hasConstraints = false;
            StringBuilder constraintFields = new StringBuilder();
            StringBuilder constraintBody = new StringBuilder();

            // Tipos de regla que son solo advertencias (no constraints)
            Set<String> warningTypes = new HashSet<>(Arrays.asList("warn_sel_is", "warn_num_less", "warn_num_greater", "warn_date_soon"));

            for (ModuleRequest.FieldDTO field : model.fields) {
                if (field.rules == null || field.rules.isEmpty()) continue;
                for (Map<String, Object> rule : field.rules) {
                    String ruleType = (String) rule.get("type");
                    // Ignorar avisos (se manejan en onchange) y reglas computed
                    if (warningTypes.contains(ruleType)) continue;
                    if ("computed".equals(ruleType)) continue;

                    hasConstraints = true;
                    String fname = getSafeFieldName(field.technicalName);
                    Object ruleValue = rule.get("value");
                    String rVal = ruleValue != null ? getSafeFieldName(ruleValue.toString()) : "";

                    // Añadir campo a la lista de @api.constrains
                    if (constraintFields.length() > 0) constraintFields.append(", ");
                    constraintFields.append("'").append(fname).append("'");
                    if (ruleType.contains("field") && ruleValue != null) {
                        constraintFields.append(", '").append(rVal).append("'");
                    }

                    // Generar el cuerpo de la regla
                    constraintBody.append("            # Regla: " + rule.get("label") + " sobre " + field.name + "\n");
                    constraintBody.append("            if record." + fname + " is not False:\n");

                    if (ruleType.equals("number_min")) {
                        constraintBody.append("                if record." + fname + " < " + ruleValue + ":\n");
                        constraintBody.append("                    raise ValidationError('¡Error! " + field.name + " no puede ser menor que " + ruleValue + "')\n");
                    } else if (ruleType.equals("number_max")) {
                        constraintBody.append("                if record." + fname + " > " + ruleValue + ":\n");
                        constraintBody.append("                    raise ValidationError('¡Error! " + field.name + " no puede ser mayor que " + ruleValue + "')\n");
                    } else if (ruleType.equals("date_no_future")) {
                        constraintBody.append("                if record." + fname + " > fields.Date.today():\n");
                        constraintBody.append("                    raise ValidationError('¡Error! " + field.name + " no puede ser una fecha futura')\n");
                    } else if (ruleType.equals("date_no_past")) {
                        constraintBody.append("                if record." + fname + " < fields.Date.today():\n");
                        constraintBody.append("                    raise ValidationError('¡Error! " + field.name + " no puede ser una fecha pasada')\n");
                    } else if (ruleType.equals("date_after_field")) {
                        constraintBody.append("                if record." + rVal + " and record." + fname + " < record." + rVal + ":\n");
                        constraintBody.append("                    raise ValidationError('¡Error! " + field.name + " debe ser posterior a " + ruleValue + "')\n");
                    } else if (ruleType.equals("date_before_field")) {
                        constraintBody.append("                if record." + rVal + " and record." + fname + " > record." + rVal + ":\n");
                        constraintBody.append("                    raise ValidationError('¡Error! " + field.name + " debe ser anterior a " + ruleValue + "')\n");
                    } else if (ruleType.equals("date_after_fixed")) {
                        constraintBody.append("                if record." + fname + " < fields.Date.from_string('" + ruleValue + "'):\n");
                        constraintBody.append("                    raise ValidationError('¡Error! " + field.name + " debe ser posterior a " + ruleValue + "')\n");
                    } else if (ruleType.equals("date_before_fixed")) {
                        constraintBody.append("                if record." + fname + " > fields.Date.from_string('" + ruleValue + "'):\n");
                        constraintBody.append("                    raise ValidationError('¡Error! " + field.name + " debe ser anterior a " + ruleValue + "')\n");
                    } else if (ruleType.equals("char_min_len")) {
                        constraintBody.append("                if len(record." + fname + ") < " + ruleValue + ":\n");
                        constraintBody.append("                    raise ValidationError('¡Error! " + field.name + " debe tener al menos " + ruleValue + " caracteres')\n");
                    } else if (ruleType.equals("char_max_len")) {
                        constraintBody.append("                if len(record." + fname + ") > " + ruleValue + ":\n");
                        constraintBody.append("                    raise ValidationError('¡Error! " + field.name + " no puede superar los " + ruleValue + " caracteres')\n");
                    }
                }
            }

            if (hasConstraints) {
                sb.append("    @api.constrains(").append(constraintFields).append(")\n");
                sb.append("    def _check_business_rules(self):\n");
                sb.append("        for record in self:\n");
                sb.append(constraintBody);
                sb.append("\n");
            }

            // 3. Notificaciones (Onchange)
            for (ModuleRequest.FieldDTO field : model.fields) {
                if (field.rules != null && field.rules.stream().anyMatch(r -> warningTypes.contains((String) r.get("type")))) {
                    String fname = getSafeFieldName(field.technicalName);
                    sb.append("    @api.onchange('" + fname + "')\n");
                    sb.append("    def _onchange_warnings_" + fname + "(self):\n");
                    sb.append("        if not self." + fname + ":\n");
                    sb.append("            return\n");
                    
                    for (Map<String, Object> rule : field.rules) {
                        if (warningTypes.contains(rule.get("type"))) {
                            String ruleType = (String) rule.get("type");
                            Object ruleValue = rule.get("value");
                            String msg = "¡Aviso! " + field.name + ": ";

                            if (ruleType.equals("warn_num_less")) {
                                sb.append("        if self." + fname + " < " + ruleValue + ":\n");
                                sb.append("            return {\n");
                                sb.append("                'warning': {'title': 'Aviso de Valor', 'message': '" + msg + "el valor es inferior a " + ruleValue + "', 'type': 'notification'}\n");
                                sb.append("            }\n");
                            } else if (ruleType.equals("warn_num_greater")) {
                                sb.append("        if self." + fname + " > " + ruleValue + ":\n");
                                sb.append("            return {\n");
                                sb.append("                'warning': {'title': 'Aviso de Valor', 'message': '" + msg + "el valor es superior a " + ruleValue + "', 'type': 'notification'}\n");
                                sb.append("            }\n");
                            } else if (ruleType.equals("warn_sel_is")) {
                                sb.append("        if self." + fname + " == '" + ruleValue + "':\n");
                                sb.append("            return {\n");
                                sb.append("                'warning': {'title': 'Notificación', 'message': 'Has seleccionado una opción marcada con aviso', 'type': 'notification'}\n");
                                sb.append("            }\n");
                            } else if (ruleType.equals("warn_date_soon")) {
                                sb.append("        limit_date = fields.Date.today() + timedelta(days=" + ruleValue + ")\n");
                                sb.append("        if self." + fname + " <= limit_date and self." + fname + " >= fields.Date.today():\n");
                                sb.append("            return {\n");
                                sb.append("                'warning': {'title': 'Fecha Próxima', 'message': '" + msg + "quedan menos de " + ruleValue + " días', 'type': 'notification'}\n");
                                sb.append("            }\n");
                            }
                        }
                    }
                    sb.append("\n");
                }
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    // Convertir nombres de campos a formato seguro (sin espacios, minúsculas, evitar palabras reservadas)
    private static String getSafeFieldName(String name) {
        if (name == null) return "";
        String clean = name.replaceAll("[\\s]+", "_").toLowerCase();
        List<String> reserved = Arrays.asList("int", "float", "char", "boolean", "date", "datetime", "selection", "list", "dict", "id", "name", "type");
        if (reserved.contains(clean)) return "f_" + clean;
        return clean;
    }

    // Capitaliza la primera letra separada por _
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
                    sb.append("          <field name=\"" + getSafeFieldName(field.technicalName) + "\"/>\n");
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
                    sb.append("            <field name=\"" + getSafeFieldName(field.technicalName) + "\"");
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
                            @SuppressWarnings("unchecked")
                            List<String> searchFields = (List<String>) view.configuration.get("fields");
                            for (String f : searchFields) {
                                sb.append("          <field name=\"" + getSafeFieldName(f) + "\"/>\n");
                            }
                        } else {
                            // Por defecto primer campo
                            if (!model.fields.isEmpty()) {
                                sb.append("          <field name=\"" + getSafeFieldName(model.fields.get(0).technicalName) + "\"/>\n");
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
                            if (row != null && !row.toString().isEmpty()) sb.append("          <field name=\"" + getSafeFieldName(row.toString()) + "\" type=\"row\"/>\n");
                            if (measure != null && !measure.toString().isEmpty()) sb.append("          <field name=\"" + getSafeFieldName(measure.toString()) + "\" type=\"measure\"/>\n");
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
