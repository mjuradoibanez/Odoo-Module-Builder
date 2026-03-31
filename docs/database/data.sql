USE omb;

-- -----------------------------
-- Usuarios
-- -----------------------------
INSERT INTO users (email, username, password) VALUES
('admin@omb.com', 'admin', '$2y$10$kdNxcjoaAWpS69Qyx7o1Y.eOw/UMrMkyQ5VSlsFxCEsrZUyI2tAam'),
('usuario@omb.com', 'usuario', '$2y$10$7brVOYxV62qQ4DrgR8hvzOAhwIfJaXHGL5nE.UpRuba99NYZtUMP6');

-- -----------------------------
-- Módulos
-- -----------------------------
INSERT INTO modules (name, technical_name, version, author, categoria, user_id) VALUES
('Academia', 'academia', '1.0', 'Admin', 'educacion', 1),
('Ventas', 'ventas', '1.0', 'Usuario', 'ventas', 2),
('RRHH', 'rrhh', '1.0', 'Admin', 'rrhh', 1),
('Inventario', 'inventario', '1.0', 'Admin', 'inventario', 1),
('OtrosMod', 'otrosmod', '1.0', 'Admin', 'otros', 1);

-- -----------------------------
-- Models
-- -----------------------------
INSERT INTO models (name, technical_name, module_id) VALUES
('Alumno', 'alumno', 1),
('Curso', 'curso', 1),
('Cliente', 'cliente', 2),
('Pedido', 'pedido', 2);

-- -----------------------------
-- Fields
-- -----------------------------
INSERT INTO fields (name, technical_name, type, required, model_id) VALUES
('Nombre', 'nombre', 'char', TRUE, 1),
('Edad', 'edad', 'integer', FALSE, 1),
('Titulo', 'titulo', 'char', TRUE, 2),
('Descripcion', 'descripcion', 'text', FALSE, 2),
('Nombre', 'nombre', 'char', TRUE, 3),
('Email', 'email', 'char', TRUE, 3),
('Fecha', 'fecha', 'date', TRUE, 4);

-- -----------------------------
-- Views
-- -----------------------------
INSERT INTO views (type, name, model_id) VALUES
('list', 'alumno_list', 1),
('form', 'alumno_form', 1),
('list', 'curso_list', 2),
('form', 'curso_form', 2);

-- -----------------------------
-- View Fields
-- -----------------------------
INSERT INTO view_fields (view_id, field_id, position) VALUES
(1, 1, 1), -- alumno_list -> nombre
(1, 2, 2), -- alumno_list -> edad
(2, 1, 1), -- alumno_form -> nombre
(2, 2, 2); -- alumno_form -> edad

-- -----------------------------
-- Deployments (simulación)
-- -----------------------------
INSERT INTO deployments (module_id, status, log) VALUES
(1, 'success', 'Módulo instalado correctamente'),
(2, 'pending', 'Esperando instalación');
