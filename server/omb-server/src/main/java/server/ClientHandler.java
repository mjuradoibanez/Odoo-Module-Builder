package server;

import command.CommandHandler;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
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
            PrintWriter salida = new PrintWriter(socket.getOutputStream(), true);

            String mensaje;

            while ((mensaje = entrada.readLine()) != null) {

                System.out.println("Received: " + mensaje);

                String response = CommandHandler.handle(mensaje);
                salida.println(response);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
