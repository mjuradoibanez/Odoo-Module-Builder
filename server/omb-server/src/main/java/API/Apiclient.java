package API;

import DTO.UserRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;

public class Apiclient {
    private static final String API_URL = "http://localhost:8082";

    public static String createUser(String email, String password) {
        try{
            // Cliente HTTP
            OkHttpClient client = new OkHttpClient();

            // Objeto DTO para transportar datos
            UserRequest user = new UserRequest(email, password);

            // Mapper para convertir a JSON
            ObjectMapper mapper = new ObjectMapper();
            String json = mapper.writeValueAsString(user);

            RequestBody body = RequestBody.create(
                    json,
                    MediaType.get("application/json")
            );

            Request request = new Request.Builder()
                    .url(API_URL + "/users")
                    .post(body)
                    .build();

            // Se envía la petición y espera la respuesta
            try (Response response = client.newCall(request).execute()) {

                if (response.body() != null) {
                    return response.body().string();
                }

                return "Empty response";

            }

        } catch (Exception e) {
            System.err.println("API ERROR: " + e.getMessage());
            return "API ERROR";
        }
    }
}
