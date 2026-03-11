package command;

import API.Apiclient;

public class CommandHandler {
    public static String handle(String mensaje) {

        // Según el mensaje recibido hace una acción u otra
        String[] parts = mensaje.split(";");
        String action = parts[0];

        switch (action) {
            case "CREATE_USER":
                return createUser(parts);

            default:
                return "ERROR: Unknown command";
        }
    }

    private static String createUser(String[] parts) {
        if (parts.length < 3) {
            return "ERROR: Missing parameters";
        }

        String email = parts[1];
        String password = parts[2];

        return Apiclient.createUser(email, password);
    }
}
