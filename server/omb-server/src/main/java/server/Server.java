package server;

import java.net.ServerSocket;
import java.net.Socket;

public class Server {
    private static int PUERTO = 5000;

    public static void main(String[] args) {
        try (ServerSocket server = new ServerSocket(PUERTO)){
            System.out.println("Servidor escuchando en el puerto: " + PUERTO +"...");

            while (true) {
                Socket cliente = server.accept();
                System.out.println("Cliente conectado: " + cliente.getInetAddress());

                ClientHandler handler = new ClientHandler(cliente);
                new Thread(handler).start();
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
