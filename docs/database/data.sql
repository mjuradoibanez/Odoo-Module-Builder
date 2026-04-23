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
INSERT INTO modules (name, technical_name, version, author, category, is_public, user_id) VALUES
('Academia', 'academia', '1.0', 'Admin', 'educacion', TRUE, 1),
('Ventas', 'ventas', '1.0', 'Usuario', 'ventas', TRUE, 2),
('RRHH', 'rrhh', '1.0', 'Admin', 'rrhh', FALSE, 1),
('Inventario', 'inventario', '1.0', 'Admin', 'inventario', FALSE, 1),
('OtrosMod', 'otrosmod', '1.0', 'Admin', 'otros', FALSE, 1);

-- -----------------------------
-- Models
-- -----------------------------
INSERT INTO models (name, technical_name, module_id) VALUES
('Alumno', 'alumno', 1),
('Curso', 'curso', 1),
('Cliente', 'cliente', 2),
('Pedido', 'pedido', 2);

-- -----------------------------
INSERT INTO fields (name, technical_name, type, required, unique_field, relation_model, relation_field, model_id) VALUES
-- Alumno
('Nombre', 'nombre', 'char', TRUE, TRUE, NULL, NULL, 1),
('Edad', 'edad', 'integer', FALSE, FALSE, NULL, NULL, 1),
('Cursos', 'cursos_ids', 'many2many', FALSE, FALSE, 'academia.curso', 'alumnos_ids', 1),
-- Curso
('Titulo', 'titulo', 'char', TRUE, TRUE, NULL, NULL, 2),
('Descripcion', 'descripcion', 'text', FALSE, FALSE, NULL, NULL, 2),
('Alumnos', 'alumnos_ids', 'many2many', FALSE, FALSE, 'academia.alumno', 'cursos_ids', 2),
('Profesor', 'profesor_id', 'many2one', FALSE, FALSE, 'academia.profesor', NULL, 2),
-- Profesor
('Nombre', 'nombre', 'char', TRUE, TRUE, NULL, NULL, 3),
('Cursos', 'cursos_ids', 'one2many', FALSE, FALSE, 'academia.curso', 'profesor_id', 3);

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
(1, 1, 1), -- alumno_list - nombre
(1, 2, 2), -- alumno_list - edad
(2, 1, 1), -- alumno_form - nombre
(2, 2, 2); -- alumno_form - edad

-- -----------------------------
-- Deployments
-- -----------------------------
INSERT INTO deployments (module_id, status, log) VALUES
(1, 'success', 'Módulo instalado correctamente'),
(2, 'pending', 'Esperando instalación');


-- CASO DE PRUEBA: Bloqueo de eliminación por dependencia entre módulos
-- Módulo A: "ModuloA" (creado por usuario 2)
-- Módulo B: "ModuloB" (creado por usuario 2) con relación hacia modelo de ModuloA
INSERT INTO modules (name, technical_name, version, author, category, is_public, user_id) VALUES
('ModuloA', 'moduloa', '1.0', 'Usuario', 'prueba', FALSE, 2),
('ModuloB', 'modulob', '1.0', 'Usuario', 'prueba', FALSE, 2);

-- Modelos para ambos módulos
INSERT INTO models (name, technical_name, module_id) VALUES
('EntidadA', 'entidada', (SELECT id FROM modules WHERE technical_name = 'moduloa')),
('EntidadB', 'entidadb', (SELECT id FROM modules WHERE technical_name = 'modulob'));

-- Campo relacional en EntidadB apuntando a EntidadA
INSERT INTO fields (name, technical_name, type, required, unique_field, relation_model, relation_field, model_id) VALUES
('RelacionA', 'relaciona_id', 'many2one', FALSE, FALSE, 'moduloa.entidada', NULL, (SELECT id FROM models WHERE technical_name = 'entidadb'));


-- CASO DE PRUEBA: Bloqueo circular entre dos módulos
-- Módulo C: "ModuloC" (usuario 2)
-- Módulo D: "ModuloD" (usuario 2)
INSERT INTO modules (name, technical_name, version, author, category, is_public, user_id) VALUES
('ModuloC', 'moduloc', '1.0', 'Usuario', 'prueba', FALSE, 2),
('ModuloD', 'modulod', '1.0', 'Usuario', 'prueba', FALSE, 2);

-- Modelos para ambos módulos
INSERT INTO models (name, technical_name, module_id) VALUES
('EntidadC', 'entidadc', (SELECT id FROM modules WHERE technical_name = 'moduloc')),
('EntidadD', 'entidadd', (SELECT id FROM modules WHERE technical_name = 'modulod'));

-- Campo many2many en EntidadC apuntando a EntidadD
INSERT INTO fields (name, technical_name, type, required, unique_field, relation_model, relation_field, model_id) VALUES
('RelacionD', 'relaciond_ids', 'many2many', FALSE, FALSE, 'modulod.entidadd', 'relacionc_ids', (SELECT id FROM models WHERE technical_name = 'entidadc'));

-- Campo many2many en EntidadD apuntando a EntidadC (bloqueo circular)
INSERT INTO fields (name, technical_name, type, required, unique_field, relation_model, relation_field, model_id) VALUES
('RelacionC', 'relacionc_ids', 'many2many', FALSE, FALSE, 'moduloc.entidadc', 'relaciond_ids', (SELECT id FROM models WHERE technical_name = 'entidadd'));
