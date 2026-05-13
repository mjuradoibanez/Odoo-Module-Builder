# Odoo Module Builder

## Descripcion

Odoo Module Builder es una aplicacion web que permite crear, configurar y desplegar modulos de Odoo de forma visual, sin necesidad de escribir codigo manualmente. El sistema almacena los metadatos de cada modulo en base de datos, genera el codigo fuente correspondiente y lo instala automaticamente en una instancia de Odoo.

---

## Tecnologias utilizadas

- **Frontend:** React
- **Backend:** Symfony (API REST)
- **Base de datos:** PostgreSQL
- **ERP:** Odoo
- **Infraestructura:** AWS / Docker

---

## Funcionalidades principales

- Creacion y edicion de modulos de Odoo
- Definicion de modelos y campos (char, text, integer, float, boolean, date, many2one)
- Generacion automatica de vistas de tipo formulario y lista
- Generacion del codigo fuente del modulo
- Despliegue automatico en una instancia de Odoo

---

## Estructura del proyecto

```
odoo-module-builder/
|
|-- frontend/          # Aplicacion React
|-- backend/           # API REST en Symfony
|-- generator/         # Motor de generacion de modulos
|-- docs/              # Documentacion del proyecto
```

---

## Modelo de datos

El sistema se compone de las siguientes entidades principales:

- **users** - Usuarios de la plataforma
- **modules** - Modulos de Odoo definidos por el usuario
- **models** - Modelos pertenecientes a cada modulo
- **fields** - Campos de cada modelo
- **deployments** - Registro de despliegues realizados

---

## Estructura del modulo generado

```
nombre_modulo/
|
|-- __manifest__.py
|-- models/
|   |-- models.py
|-- views/
|   |-- views.xml
|-- security/
|   |-- ir.model.access.csv
```

---

## Manual de Despliegue y Ejecución

### Requisitos previos

El proyecto ha sido diseñado para ejecutarse completamente en entorno local utilizando contenedores, por lo que no requiere configuración manual de servidores externos.

Para ejecutar el proyecto es necesario tener instalado:
- Docker
- Docker Compose
- Node.js
- Git (Opcional para clonar el repositorio)

### Paso 1: Clonar el repositorio

Clonar el proyecto desde el repositorio oficial:

```bash
git clone https://github.com/mjuradoibanez/Odoo-Module-Builder.git
cd odoo-module-builder
```

### Paso 2: Configuración del entorno

En la raíz del proyecto se incluye un archivo [`.env.example`](.env.example) con todas las variables necesarias para los contenedores. Cópialo a `.env`:

```bash
cp .env.example .env
```

Estas variables configuran:
- Base de datos MySQL del backend
- Base de datos PostgreSQL de Odoo
- Credenciales de conexión entre backend y Odoo
- Rutas de despliegue de módulos
- Configuración de la aplicación Symfony (`APP_ENV`, `APP_SECRET`, `DATABASE_URL`)

No es necesario modificar estas variables para el correcto funcionamiento del proyecto.

Además, el frontend necesita su propio archivo de entorno. Desde la carpeta `frontend/ombApp`:

```bash
cp frontend/ombApp/.env.example frontend/ombApp/.env
```

### Paso 3: Levantar la infraestructura completa

Desde la raíz del proyecto ejecutar:

```bash
docker compose up -d --build
```

Este comando levanta automáticamente toda la estructura del sistema:

- **Backend API** — Inicia una API REST desarrollada con Symfony que expone los endpoints necesarios. Disponible en: http://localhost:8082
- **Base de datos del backend** — Se inicia una base de datos MySQL que importa automáticamente `schema.sql` y `data.sql` en el primer arranque.
- **Servidor generador** — Se inicia un servidor desarrollado en Java que se encarga de recibir la configuración del módulo y generar los archivos Python y XML.
- **Entorno ERP** — Se levanta una instancia de Odoo junto con su base de datos PostgreSQL. Disponible en http://localhost:8069 con el acceso `admin:admin`

### Paso 4: Ejecutar el frontend

Desde la carpeta `frontend/ombApp`, instalar dependencias y ejecutar:

```bash
npm install
npx expo start
```

### Paso 5: Validación

Para validar el sistema se recomienda seguir estos pasos:
1. Registrar un usuario
2. Iniciar sesión
3. Crear un módulo
4. Añadir modelos, campos y vistas
5. Generar módulo en ZIP
6. Lanzar despliegue contra Odoo
7. Comprobar módulo en Odoo

El resultado esperado es que el módulo aparezca instalado correctamente dentro del ERP y quede registrado en el historial de despliegues.

### Apagado del sistema

Para detener toda la infraestructura:

```bash
docker compose down
```

Para detener y eliminar también volúmenes:

```bash
docker compose down -v
```

---

## Autor
María Jurado Ibáñez
Proyecto Intermodular -- Desarrollo de Aplicaciones Multiplataforma (DAM)
