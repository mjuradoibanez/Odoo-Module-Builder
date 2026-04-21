-- ---------------------------------------------------
-- Odoo Module Builder - Schema para Symfony / MySQL
-- ---------------------------------------------------

DROP DATABASE IF EXISTS omb;
CREATE DATABASE omb;
USE omb;

-- -----------------------------
-- Tabla users
-- -----------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------
-- Tabla modules
-- -----------------------------
DROP TABLE IF EXISTS modules;
CREATE TABLE modules (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  technical_name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(255),
  author VARCHAR(255),
  category VARCHAR(50) DEFAULT 'otra',
  is_public BOOLEAN DEFAULT FALSE,
  user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_modules_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------
-- Tabla models
-- -----------------------------
DROP TABLE IF EXISTS models;
CREATE TABLE models (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  technical_name VARCHAR(255) NOT NULL,
  module_id INT,
  CONSTRAINT fk_models_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- -----------------------------
-- Tabla fields
-- -----------------------------
DROP TABLE IF EXISTS fields;
CREATE TABLE fields (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  technical_name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  unique_field BOOLEAN DEFAULT FALSE,
  relation_model VARCHAR(255),
  relation_field VARCHAR(255),
  model_id INT,
  CONSTRAINT fk_fields_model FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
);

-- -----------------------------
-- Tabla views
-- -----------------------------
DROP TABLE IF EXISTS views;
CREATE TABLE views (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  type VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  model_id INT,
  CONSTRAINT fk_views_model FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
);

-- -----------------------------
-- Tabla view_fields
-- -----------------------------
DROP TABLE IF EXISTS view_fields;
CREATE TABLE view_fields (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  view_id INT,
  field_id INT,
  position INT DEFAULT 0,
  CONSTRAINT fk_view_fields_view FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE,
  CONSTRAINT fk_view_fields_field FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
);

-- -----------------------------
-- Tabla deployments
-- -----------------------------
DROP TABLE IF EXISTS deployments;
CREATE TABLE deployments (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  module_id INT,
  status VARCHAR(255),
  log TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_deployments_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);
