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

## Instalacion y configuracion

> Proximamente.

---

## Autor
María Jurado Ibáñez
Proyecto Intermodular -- Desarrollo de Aplicaciones Multiplataforma (DAM)
