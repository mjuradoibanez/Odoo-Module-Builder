package command;

import DTO.ModuleRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import generator.ModuleGenerator;
import java.io.File;

public class CommandHandler {
    public static class ZipResult {
        public File zipFile;
        public String error;
    }

    // Procesa el mensaje recibido
    public static ZipResult handleWithZip(String mensaje) {
        ZipResult result = new ZipResult();
        
        String[] parts = mensaje.split(";", 2); // Divide el mensaje en dos partes
        String action = parts[0];
        
        switch (action) {
            case "GENERATE_MODULE":
                // Si faltan datos
                if (parts.length < 2) {
                    result.error = "Missing module data";
                    return result;
                }

                return generateModuleZip(parts[1]);
            
            default:
                result.error = "Unknown command";
                return result;
        }
    }

    // Genera el ZIP a partir del JSON recibido y devuelve el resultado
    private static ZipResult generateModuleZip(String json) {
        ZipResult result = new ZipResult();
        
        try {
            ObjectMapper mapper = new ObjectMapper(); // Para leer JSON
            // Ignora campos del JSON que no estén en la clase DTO
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            // Mapea el JSON a un objeto ModuleRequest
            ModuleRequest module = mapper.readValue(json, ModuleRequest.class);

            // Genera la estructura de carpetas y archivos del módulo
            File tempDir = ModuleGenerator.generateModuleWithThreads(module);

            // Define la ruta del ZIP
            String zipPath = tempDir.getAbsolutePath() + ".zip";
            
            // Comprime la carpeta en un ZIP
            ModuleGenerator.zipFolder(tempDir, zipPath);
            
            // Guarda el archivo ZIP en el resultado
            result.zipFile = new File(zipPath);
        } catch (Exception e) {
            result.error = e.getMessage();
        }
        return result;
    }
}
