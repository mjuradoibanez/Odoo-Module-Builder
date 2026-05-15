SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- -----------------------------
-- Usuarios
-- -----------------------------
INSERT INTO users (email, username, password) VALUES
('admin@omb.com', 'admin', '$2y$10$kdNxcjoaAWpS69Qyx7o1Y.eOw/UMrMkyQ5VSlsFxCEsrZUyI2tAam'),
('usuario@omb.com', 'usuario', '$2y$10$7brVOYxV62qQ4DrgR8hvzOAhwIfJaXHGL5nE.UpRuba99NYZtUMP6');

-- -----------------------------
-- Módulos
-- -----------------------------

-- Usuario 1 (admin)
INSERT INTO modules (name, technical_name, description, version, author, category, is_public, user_id) VALUES
('Academia', 'academia', 'Gestión de alumnos, cursos y profesores para centros educativos.', '1.0', 'Admin', 'educacion', TRUE, 1),
('RRHH', 'rrhh', 'Gestión interna de empleados, departamentos y nóminas.', '1.0', 'Admin', 'rrhh', FALSE, 1),
('Inventario', 'inventario', 'Control de stock, almacenes y movimientos de producto.', '1.0', 'Admin', 'inventario', FALSE, 1);

-- Usuario 2 (usuario)
INSERT INTO modules (name, technical_name, description, version, author, category, is_public, user_id) VALUES
('Ventas', 'ventas', 'Gestión de clientes, pedidos y facturación.', '1.0', 'Usuario', 'ventas', TRUE, 2),
('Marketing', 'marketing', 'Campañas de email, segmentación de contactos y estadísticas.', '1.0', 'Usuario', 'marketing', FALSE, 2),
('Biblioteca', 'biblioteca', 'Sistema de préstamo de libros con control de socios y ejemplares.', '1.0', 'Usuario', 'otra', TRUE, 2);

-- -----------------------------
-- Modelos
-- -----------------------------

-- Academia
INSERT INTO models (name, technical_name, module_id) VALUES
('Alumno', 'alumno', 1),
('Curso', 'curso', 1),
('Profesor', 'profesor', 1);

-- RRHH
INSERT INTO models (name, technical_name, module_id) VALUES
('Departamento', 'departamento', 2),
('Empleado', 'empleado', 2);

-- Inventario
INSERT INTO models (name, technical_name, module_id) VALUES
('Almacén', 'almacen', 3),
('Producto', 'producto', 3),
('Movimiento', 'movimiento', 3);

-- Ventas
INSERT INTO models (name, technical_name, module_id) VALUES
('Cliente', 'cliente', 4),
('Pedido', 'pedido', 4),
('Línea de pedido', 'linea_pedido', 4);

-- Marketing
INSERT INTO models (name, technical_name, module_id) VALUES
('Contacto', 'contacto', 5),
('Campaña', 'campania', 5);

-- Biblioteca
INSERT INTO models (name, technical_name, module_id) VALUES
('Socio', 'socio', 6),
('Libro', 'libro', 6),
('Préstamo', 'prestamo', 6);

-- -----------------------------
-- Campos
-- -----------------------------

-- Academia > Alumno
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Nombre', 'nombre', 'char', TRUE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, 1),
('Apellidos', 'apellidos', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 1),
('Email', 'email', 'char', FALSE, TRUE, NULL, NULL, '[{"type":"char_max_len","value":"100","label":"Longitud máxima"}]', NULL, NULL, NULL, 1),
('Edad', 'edad', 'integer', FALSE, FALSE, NULL, NULL, '[{"type":"number_min","value":"0","label":"Valor mínimo"},{"type":"number_max","value":"120","label":"Valor máximo"}]', NULL, NULL, NULL, 1),
('Fecha de nacimiento', 'fecha_nacimiento', 'date', FALSE, FALSE, NULL, NULL, '[{"type":"date_no_future","value":"","label":"No permitir fechas futuras"}]', NULL, NULL, NULL, 1),
('Teléfono', 'telefono', 'char', FALSE, FALSE, NULL, NULL, '[{"type":"char_min_len","value":"9","label":"Longitud mínima"},{"type":"char_max_len","value":"15","label":"Longitud máxima"}]', NULL, NULL, NULL, 1),
('Cursos', 'cursos_ids', 'many2many', FALSE, FALSE, NULL, NULL, NULL, 'academia.curso', 'alumnos_ids', 'academia', 1);

-- Academia > Curso
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Título', 'titulo', 'char', TRUE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, 2),
('Descripción', 'descripcion', 'text', FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 2),
('Horas', 'horas', 'integer', FALSE, FALSE, NULL, NULL, '[{"type":"number_min","value":"1","label":"Valor mínimo"}]', NULL, NULL, NULL, 2),
('Estado', 'estado', 'selection', FALSE, FALSE, 'activo', '[{"key":"activo","label":"Activo"},{"key":"finalizado","label":"Finalizado"},{"key":"cancelado","label":"Cancelado"}]', NULL, NULL, NULL, NULL, 2),
('Alumnos', 'alumnos_ids', 'many2many', FALSE, FALSE, NULL, NULL, NULL, 'academia.alumno', 'cursos_ids', 'academia', 2),
('Profesor', 'profesor_id', 'many2one', FALSE, FALSE, NULL, NULL, NULL, 'academia.profesor', NULL, 'academia', 2);

-- Academia > Profesor
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Nombre', 'nombre', 'char', TRUE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, 3),
('Apellidos', 'apellidos', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 3),
('Email', 'email', 'char', FALSE, TRUE, NULL, NULL, '[{"type":"char_max_len","value":"100","label":"Longitud máxima"}]', NULL, NULL, NULL, 3),
('Especialidad', 'especialidad', 'selection', FALSE, FALSE, NULL, '[{"key":"matematicas","label":"Matemáticas"},{"key":"lengua","label":"Lengua"},{"key":"ciencias","label":"Ciencias"},{"key":"historia","label":"Historia"},{"key":"informatica","label":"Informática"}]', NULL, NULL, NULL, NULL, 3),
('Cursos', 'cursos_ids', 'one2many', FALSE, FALSE, NULL, NULL, NULL, 'academia.curso', 'profesor_id', 'academia', 3);

-- RRHH > Departamento
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Nombre', 'nombre', 'char', TRUE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, 4),
('Código', 'codigo', 'char', TRUE, TRUE, NULL, NULL, '[{"type":"char_max_len","value":"10","label":"Longitud máxima"}]', NULL, NULL, NULL, 4),
('Presupuesto', 'presupuesto', 'float', FALSE, FALSE, NULL, NULL, '[{"type":"number_min","value":"0","label":"Valor mínimo"}]', NULL, NULL, NULL, 4);

-- RRHH > Empleado
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Nombre', 'nombre', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 5),
('Apellidos', 'apellidos', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 5),
('DNI', 'dni', 'char', TRUE, TRUE, NULL, NULL, '[{"type":"char_min_len","value":"9","label":"Longitud mínima"},{"type":"char_max_len","value":"9","label":"Longitud máxima"}]', NULL, NULL, NULL, 5),
('Email', 'email', 'char', FALSE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, 5),
('Salario', 'salario', 'float', FALSE, FALSE, NULL, NULL, '[{"type":"number_min","value":"0","label":"Valor mínimo"}]', NULL, NULL, NULL, 5),
('Tipo de contrato', 'tipo_contrato', 'selection', TRUE, FALSE, 'indefinido', '[{"key":"indefinido","label":"Indefinido"},{"key":"temporal","label":"Temporal"},{"key":"practicas","label":"Prácticas"},{"key":"autonomo","label":"Autónomo"}]', NULL, NULL, NULL, NULL, 5),
('Departamento', 'departamento_id', 'many2one', TRUE, FALSE, NULL, NULL, NULL, 'rrhh.departamento', NULL, 'rrhh', 5);

-- Inventario > Almacén
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Nombre', 'nombre', 'char', TRUE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, 6),
('Ubicación', 'ubicacion', 'char', FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 6);

-- Inventario > Producto
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Nombre', 'nombre', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 7),
('Código SKU', 'codigo_sku', 'char', TRUE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, 7),
('Descripción', 'descripcion', 'text', FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 7),
('Precio', 'precio', 'float', TRUE, FALSE, NULL, NULL, '[{"type":"number_min","value":"0","label":"Valor mínimo"}]', NULL, NULL, NULL, 7),
('Stock mínimo', 'stock_minimo', 'integer', FALSE, FALSE, '0', NULL, '[{"type":"number_min","value":"0","label":"Valor mínimo"}]', NULL, NULL, NULL, 7),
('Categoría', 'categoria', 'selection', FALSE, FALSE, NULL, '[{"key":"electronica","label":"Electrónica"},{"key":"hogar","label":"Hogar"},{"key":"alimentacion","label":"Alimentación"},{"key":"ropa","label":"Ropa"},{"key":"otros","label":"Otros"}]', NULL, NULL, NULL, NULL, 7),
('Almacén', 'almacen_id', 'many2one', TRUE, FALSE, NULL, NULL, NULL, 'inventario.almacen', NULL, 'inventario', 7);

-- Inventario > Movimiento
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Producto', 'producto_id', 'many2one', TRUE, FALSE, NULL, NULL, NULL, 'inventario.producto', NULL, 'inventario', 8),
('Almacén origen', 'almacen_origen_id', 'many2one', FALSE, FALSE, NULL, NULL, NULL, 'inventario.almacen', NULL, 'inventario', 8),
('Almacén destino', 'almacen_destino_id', 'many2one', FALSE, FALSE, NULL, NULL, NULL, 'inventario.almacen', NULL, 'inventario', 8),
('Cantidad', 'cantidad', 'integer', TRUE, FALSE, NULL, NULL, '[{"type":"number_min","value":"1","label":"Valor mínimo"}]', NULL, NULL, NULL, 8),
('Tipo', 'tipo', 'selection', TRUE, FALSE, 'entrada', '[{"key":"entrada","label":"Entrada"},{"key":"salida","label":"Salida"},{"key":"traslado","label":"Traslado"}]', NULL, NULL, NULL, NULL, 8),
('Fecha', 'fecha', 'date', TRUE, FALSE, NULL, NULL, '[{"type":"date_no_future","value":"","label":"No permitir fechas futuras"}]', NULL, NULL, NULL, 8);

-- Ventas > Cliente
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Nombre', 'nombre', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 9),
('Email', 'email', 'char', FALSE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, 9),
('Teléfono', 'telefono', 'char', FALSE, FALSE, NULL, NULL, '[{"type":"char_min_len","value":"9","label":"Longitud mínima"}]', NULL, NULL, NULL, 9),
('Tipo de cliente', 'tipo_cliente', 'selection', FALSE, FALSE, 'particular', '[{"key":"particular","label":"Particular"},{"key":"empresa","label":"Empresa"}]', NULL, NULL, NULL, NULL, 9);

-- Ventas > Pedido
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Cliente', 'cliente_id', 'many2one', TRUE, FALSE, NULL, NULL, NULL, 'ventas.cliente', NULL, 'ventas', 10),
('Fecha', 'fecha', 'date', TRUE, FALSE, NULL, NULL, '[{"type":"date_no_future","value":"","label":"No permitir fechas futuras"}]', NULL, NULL, NULL, 10),
('Estado', 'estado', 'selection', FALSE, FALSE, 'pendiente', '[{"key":"pendiente","label":"Pendiente"},{"key":"confirmado","label":"Confirmado"},{"key":"enviado","label":"Enviado"},{"key":"entregado","label":"Entregado"},{"key":"cancelado","label":"Cancelado"}]', NULL, NULL, NULL, NULL, 10),
('Total', 'total', 'float', FALSE, FALSE, NULL, NULL, '[{"type":"number_min","value":"0","label":"Valor mínimo"}]', NULL, NULL, NULL, 10);

-- Ventas > Línea de pedido
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Pedido', 'pedido_id', 'many2one', TRUE, FALSE, NULL, NULL, NULL, 'ventas.pedido', NULL, 'ventas', 11),
('Producto', 'producto', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 11),
('Cantidad', 'cantidad', 'integer', TRUE, FALSE, '1', NULL, '[{"type":"number_min","value":"1","label":"Valor mínimo"}]', NULL, NULL, NULL, 11),
('Precio unitario', 'precio_unitario', 'float', TRUE, FALSE, NULL, NULL, '[{"type":"number_min","value":"0","label":"Valor mínimo"}]', NULL, NULL, NULL, 11);

-- Marketing > Contacto
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Nombre', 'nombre', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 12),
('Email', 'email', 'char', TRUE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, 12),
('Teléfono', 'telefono', 'char', FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 12),
('Segmento', 'segmento', 'selection', FALSE, FALSE, NULL, '[{"key":"nuevo","label":"Nuevo"},{"key":"recurrente","label":"Recurrente"},{"key":"vip","label":"VIP"},{"key":"inactivo","label":"Inactivo"}]', NULL, NULL, NULL, NULL, 12);

-- Marketing > Campaña
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Nombre', 'nombre', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 13),
('Asunto', 'asunto', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 13),
('Cuerpo', 'cuerpo', 'text', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 13),
('Fecha de envío', 'fecha_envio', 'date', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 13),
('Estado', 'estado', 'selection', FALSE, FALSE, 'borrador', '[{"key":"borrador","label":"Borrador"},{"key":"programada","label":"Programada"},{"key":"enviada","label":"Enviada"},{"key":"cancelada","label":"Cancelada"}]', NULL, NULL, NULL, NULL, 13);

-- Biblioteca > Socio
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Nombre', 'nombre', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 14),
('DNI', 'dni', 'char', TRUE, TRUE, NULL, NULL, '[{"type":"char_min_len","value":"9","label":"Longitud mínima"},{"type":"char_max_len","value":"9","label":"Longitud máxima"}]', NULL, NULL, NULL, 14),
('Email', 'email', 'char', FALSE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, 14),
('Teléfono', 'telefono', 'char', FALSE, FALSE, NULL, NULL, '[{"type":"char_min_len","value":"9","label":"Longitud mínima"}]', NULL, NULL, NULL, 14),
('Fecha de alta', 'fecha_alta', 'date', FALSE, FALSE, NULL, NULL, '[{"type":"date_no_future","value":"","label":"No permitir fechas futuras"}]', NULL, NULL, NULL, 14);

-- Biblioteca > Libro
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Título', 'titulo', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 15),
('Autor', 'autor', 'char', TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 15),
('ISBN', 'isbn', 'char', TRUE, TRUE, NULL, NULL, '[{"type":"char_min_len","value":"10","label":"Longitud mínima"},{"type":"char_max_len","value":"13","label":"Longitud máxima"}]', NULL, NULL, NULL, 15),
('Género', 'genero', 'selection', FALSE, FALSE, NULL, '[{"key":"novela","label":"Novela"},{"key":"ensayo","label":"Ensayo"},{"key":"poesia","label":"Poesía"},{"key":"ciencia","label":"Ciencia"},{"key":"historia","label":"Historia"}]', NULL, NULL, NULL, NULL, 15),
('Año', 'anio', 'integer', FALSE, FALSE, NULL, NULL, '[{"type":"number_min","value":"1900","label":"Valor mínimo"}]', NULL, NULL, NULL, 15),
('Ejemplares', 'ejemplares', 'integer', FALSE, FALSE, '1', NULL, '[{"type":"number_min","value":"1","label":"Valor mínimo"}]', NULL, NULL, NULL, 15);

-- Biblioteca > Préstamo
INSERT INTO fields (name, technical_name, type, required, unique_field, default_value, selection_options, rules, relation_model, relation_field, relation_module, model_id) VALUES
('Socio', 'socio_id', 'many2one', TRUE, FALSE, NULL, NULL, NULL, 'biblioteca.socio', NULL, 'biblioteca', 16),
('Libro', 'libro_id', 'many2one', TRUE, FALSE, NULL, NULL, NULL, 'biblioteca.libro', NULL, 'biblioteca', 16),
('Fecha de préstamo', 'fecha_prestamo', 'date', TRUE, FALSE, NULL, NULL, '[{"type":"date_no_future","value":"","label":"No permitir fechas futuras"}]', NULL, NULL, NULL, 16),
('Fecha de devolución', 'fecha_devolucion', 'date', FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, 16),
('Estado', 'estado', 'selection', FALSE, FALSE, 'prestado', '[{"key":"prestado","label":"Prestado"},{"key":"devuelto","label":"Devuelto"},{"key":"perdido","label":"Perdido"}]', '[{"type":"warn_sel_is","value":"perdido","label":"Aviso si se selecciona"}]', NULL, NULL, NULL, 16);

-- -----------------------------
-- Vistas
-- -----------------------------

-- Academia > Alumno
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de alumnos', '{"fields":["nombre","apellidos","email"]}', 1),
('kanban', 'Kanban de alumnos', '{"group_by":"edad"}', 1);

-- Academia > Curso
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de cursos', '{"fields":["titulo","descripcion"]}', 2),
('calendar', 'Calendario de cursos', '{"date_start":"create_date"}', 2),
('graph', 'Gráfico de cursos', '{"graph_type":"bar","row_field":"estado","measure_field":"horas"}', 2);

-- Academia > Profesor
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de profesores', '{"fields":["nombre","apellidos","especialidad"]}', 3);

-- RRHH > Departamento
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de departamentos', '{"fields":["nombre","codigo"]}', 4);

-- RRHH > Empleado
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de empleados', '{"fields":["nombre","apellidos","dni","departamento_id"]}', 5),
('kanban', 'Kanban de empleados', '{"group_by":"departamento_id"}', 5),
('graph', 'Gráfico de empleados', '{"graph_type":"bar","row_field":"tipo_contrato","measure_field":"salario"}', 5);

-- Inventario > Producto
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de productos', '{"fields":["nombre","codigo_sku","categoria"]}', 7),
('kanban', 'Kanban de productos', '{"group_by":"categoria"}', 7),
('graph', 'Gráfico de productos', '{"graph_type":"pie","row_field":"categoria","measure_field":"precio"}', 7);

-- Inventario > Movimiento
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de movimientos', '{"fields":["tipo","producto_id"]}', 8),
('calendar', 'Calendario de movimientos', '{"date_start":"fecha"}', 8);

-- Ventas > Cliente
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de clientes', '{"fields":["nombre","email","tipo_cliente"]}', 9),
('kanban', 'Kanban de clientes', '{"group_by":"tipo_cliente"}', 9);

-- Ventas > Pedido
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de pedidos', '{"fields":["cliente_id","estado"]}', 10),
('graph', 'Gráfico de pedidos', '{"graph_type":"bar","row_field":"estado","measure_field":"total"}', 10);

-- Marketing > Contacto
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de contactos', '{"fields":["nombre","email","segmento"]}', 12),
('kanban', 'Kanban de contactos', '{"group_by":"segmento"}', 12);

-- Marketing > Campaña
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de campañas', '{"fields":["nombre","estado"]}', 13),
('calendar', 'Calendario de campañas', '{"date_start":"fecha_envio"}', 13);

-- Biblioteca > Socio
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de socios', '{"fields":["nombre","dni","email"]}', 14),
('kanban', 'Kanban de socios', '{}', 14);

-- Biblioteca > Libro
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de libros', '{"fields":["titulo","autor","isbn","genero"]}', 15),
('graph', 'Gráfico de libros', '{"graph_type":"pie","row_field":"genero","measure_field":"ejemplares"}', 15);

-- Biblioteca > Préstamo
INSERT INTO views (type, name, configuration, model_id) VALUES
('search', 'Búsqueda de préstamos', '{"fields":["estado"]}', 16),
('calendar', 'Calendario de préstamos', '{"date_start":"fecha_prestamo","date_stop":"fecha_devolucion"}', 16);

-- -----------------------------
-- Favoritos
-- -----------------------------

-- Admin
INSERT INTO favorites (user_id, module_id) VALUES
(1, 4),
(1, 6);

-- Usuario
INSERT INTO favorites (user_id, module_id) VALUES
(2, 1),
(2, 2);
