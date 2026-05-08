# Dockerfile para PHP 8.1 con Composer
FROM php:8.1-apache

# Instala dependencias necesarias para Composer y extensiones comunes
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git unzip zip libzip-dev libpng-dev libonig-dev libxml2-dev \
        docker.io \
    && docker-php-ext-install pdo pdo_mysql zip sockets

# Instala Composer
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php --install-dir=/usr/local/bin --filename=composer \
    && rm composer-setup.php

# Habilita mod_rewrite de Apache (útil para Symfony)
RUN a2enmod rewrite

# Añade www-data al grupo root para que pueda escribir en volúmenes montados
# donde el grupo propietario es root (ej. /mnt/extra-addons con permisos 775)
RUN usermod -aG root www-data

# Copia el virtualhost si lo tienes personalizado (opcional)
# COPY ./provisioning/sites-enabled/omb-api.conf /etc/apache2/sites-enabled/omb-api.conf

WORKDIR /code
