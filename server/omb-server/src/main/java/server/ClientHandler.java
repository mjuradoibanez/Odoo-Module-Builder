package server;

import command.CommandHandler;
import java.io.*;
import java.net.Socket;

public class ClientHandler implements Runnable {
    private Socket socket;

    public ClientHandler(Socket socket) {
        this.socket = socket;
    }

    @Override
    public void run() {
        try {
            BufferedReader entrada = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            OutputStream out = socket.getOutputStream();
            String mensaje;

            // Lee mensajes del cliente línea a línea
            while ((mensaje = entrada.readLine()) != null) {
                System.out.println("Received: " + mensaje);

                // Procesa el comando recibido y genera el ZIP
                command.CommandHandler.ZipResult result = command.CommandHandler.handleWithZip(mensaje);
                
                if (result.error != null) {
                    out.write(("ERROR: " + result.error + "\n").getBytes());
                    out.flush();
                } else if (result.zipFile != null) {
                    out.write("OK:ZIP\n".getBytes()); // Pasa la respuesta a bytes para pasar por el OutputStream

                    // Lee el archivo ZIP a un array de bytes
                    byte[] zipBytes = readAllBytes(result.zipFile);
                    int size = zipBytes.length; // Tamaño del ZIP
                    
                    // Envía el tamaño del ZIP en 4 bytes (big-endian: estándar de red)
                    out.write(new byte[] {
                        (byte)((size >> 24) & 0xFF),
                        (byte)((size >> 16) & 0xFF),
                        (byte)((size >> 8) & 0xFF),
                        (byte)(size & 0xFF)
                    });

                    out.write(zipBytes);
                    out.flush();
                } else {
                    out.write("ERROR: Unknown error\n".getBytes());
                    out.flush();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // Lee todo el contenido de un archivo y lo devuelve como array de bytes
    private byte[] readAllBytes(File file) throws IOException {
        try (
            FileInputStream fis = new FileInputStream(file)
        ) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192]; // Fragmento de 8KB para leer el archivo
            int read;
            
            // Lee el archivo en bloques hasta el final
            while ((read = fis.read(buffer)) != -1) { // -1 indica el final del archivo
                baos.write(buffer, 0, read);
            }
            
            return baos.toByteArray(); // Devuelve el contenido completo
        }
    }
}
