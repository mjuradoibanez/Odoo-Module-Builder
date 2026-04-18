package command;


import DTO.ModuleRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import generator.ModuleGenerator;

public class CommandHandler {
    public static String handle(String mensaje) {

        // Según el mensaje recibido hace una acción u otra
        String[] parts = mensaje.split(";", 2);
        String action = parts[0];

        switch (action) {
            case "GENERATE_MODULE":
                if (parts.length < 2) return "ERROR: Missing module data";
                return generateModule(parts[1]);
            default:
                return "ERROR: Unknown command";
        }
    }

    private static String generateModule(String json) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            ModuleRequest module = mapper.readValue(json, ModuleRequest.class);

            // Generación concurrente de archivos
            java.io.File tempDir = ModuleGenerator.generateModuleWithThreads(module);
            
            // Luego se comprimirá y enviará el ZIP
            
            return "OK: Module generated at: " + tempDir.getAbsolutePath();
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
    }
}
