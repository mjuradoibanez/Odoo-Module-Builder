package DTO;

import java.util.List;
import java.util.Map;

public class ModuleRequest {
    public int id;
    public String name;
    public String technicalName;
    public String description;
    public String version;
    public String author;
    public String createdAt;
    public String category;
    public boolean isPublic;
    public UserDTO user;
    public List<ModelDTO> models;
    
    public static class UserDTO {
        public int id;
        public String username;
        public String email;
        public String firstName;
        public String lastName;
    }

    public static class ModelDTO {
        public int id;
        public String name;
        public String technicalName;
        public List<FieldDTO> fields;
        public List<ViewDTO> views;
    }

    public static class FieldDTO {
        public int id;
        public String name;
        public String technicalName;
        public String type;
        public boolean required;
        public boolean unique;
        public String relationModel;
        public String relationField; // Para one2many: campo inverso
        public String relationModule; // Módulo al que pertenece el modelo relacionado
    }

    public static class ViewDTO {
        public int id;
        public String type;
        public String name;
        public Map<String, Object> configuration;
    }
}
