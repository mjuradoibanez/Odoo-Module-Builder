CREATE TABLE "users" (
  "id" integer PRIMARY KEY,
  "email" varchar,
  "password" varchar,
  "created_at" timestamp
);

CREATE TABLE "modules" (
  "id" integer PRIMARY KEY,
  "name" varchar,
  "technical_name" varchar,
  "description" text,
  "version" varchar,
  "user_id" integer,
  "created_at" timestamp
);

CREATE TABLE "models" (
  "id" integer PRIMARY KEY,
  "name" varchar,
  "technical_name" varchar,
  "module_id" integer
);

CREATE TABLE "fields" (
  "id" integer PRIMARY KEY,
  "name" varchar,
  "technical_name" varchar,
  "type" varchar,
  "required" boolean,
  "relation_model" varchar,
  "model_id" integer
);

CREATE TABLE "views" (
  "id" integer PRIMARY KEY,
  "type" varchar,
  "model_id" integer
);

CREATE TABLE "deployments" (
  "id" integer PRIMARY KEY,
  "module_id" integer,
  "status" varchar,
  "log" text,
  "created_at" timestamp
);

ALTER TABLE "modules" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "models" ADD FOREIGN KEY ("module_id") REFERENCES "modules" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "fields" ADD FOREIGN KEY ("model_id") REFERENCES "models" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "views" ADD FOREIGN KEY ("model_id") REFERENCES "models" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "deployments" ADD FOREIGN KEY ("module_id") REFERENCES "modules" ("id") DEFERRABLE INITIALLY IMMEDIATE;
