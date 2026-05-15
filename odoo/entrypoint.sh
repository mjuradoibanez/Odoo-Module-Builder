#!/bin/bash
# Odoo Module Builder - Entrypoint personalizado para Odoo
# Crea la base de datos y la inicializa automáticamente si no existe

set -e

# Esperar a que PostgreSQL esté disponible
echo "Esperando a PostgreSQL..."
until PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c '\q' 2>/dev/null; do
  echo "   PostgreSQL no está listo aún - esperando 2s..."
  sleep 2
done
echo "PostgreSQL está disponible"

# Comprobar si la base de datos existe
DB_EXISTS=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null)

if [ "${DB_EXISTS}" != "1" ]; then
  echo "Creando base de datos '${DB_NAME}'..."
  PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";" 2>/dev/null
  echo "Base de datos '${DB_NAME}' creada"
fi

# Comprobar si Odoo ya tiene el esquema inicializado (tabla res_users)
SCHEMA_EXISTS=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='res_users'" 2>/dev/null)

if [ "${SCHEMA_EXISTS}" != "1" ]; then
  echo "El esquema de Odoo no está inicializado en '${DB_NAME}'"
  echo "Inicializando esquema de Odoo e iniciando servidor..."
  # Pasar -d (database) e -i (init) para que Odoo inicialice la BDD existente
  exec /entrypoint.sh -- -d "${DB_NAME}" -i base --without-demo=all
else
  echo "El esquema de Odoo ya está inicializado"
  # Arranque normal
  echo "Iniciando Odoo..."
  if [ $# -eq 0 ]; then
    exec /entrypoint.sh --
  else
    exec /entrypoint.sh "$@"
  fi
fi
