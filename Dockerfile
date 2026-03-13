### Dockerfile multi-stage simple pour déployer le monolithe Laravel + Vite
### Note: ceci privilégie la simplicité pour un premier déploiement Render.

# Builder: composer (vendor)
FROM composer:2 AS composer
WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Builder: node (assets)
FROM node:18 AS node
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --silent
COPY . .
# build frontend assets into public/build (vite + laravel-vite-plugin expected)
RUN npm run build

# Runtime
FROM php:8.2-cli
WORKDIR /var/www/html

# Install system deps required by some PHP extensions (lightweight)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip libzip-dev libpng-dev libonig-dev libxml2-dev curl && rm -rf /var/lib/apt/lists/*

# Install PHP extensions commonly used by Laravel
RUN docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd zip

# Copy vendor from composer stage
COPY --from=composer /app/vendor ./vendor

# Copy built frontend assets from node stage (public/build)
COPY --from=node /app/public ./public

# Copy application files
COPY . .

# Ensure APP_KEY exists at runtime fallback (Render env should set APP_KEY)
RUN php -r "if(!file_exists('.env')) copy('.env.example', '.env');" || true

# Fix permissions for storage/cache
RUN chown -R www-data:www-data storage bootstrap/cache public || true

EXPOSE 10000

# Use the PORT env var if provided by the platform
CMD ["bash","-lc","php artisan migrate --force || true; php artisan config:cache || true; php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"]
