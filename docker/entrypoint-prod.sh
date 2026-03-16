#!/bin/bash
set -e

# Récupère le port depuis l'env, sinon utilise 10000
PORT=${PORT:-10000}

echo "🚀 Starting application on port $PORT..."

# Remplace le port dans la config Nginx (IPv4 et IPv6)
sed -i "s/listen 0.0.0.0:10000;/listen 0.0.0.0:$PORT;/" /etc/nginx/conf.d/default.conf
# Remplace aussi la ligne IPv6 en conservant la forme '[::]:PORT'
sed -i "s/listen \[::\]:10000;/listen [::]:$PORT;/" /etc/nginx/conf.d/default.conf

# Crée les répertoires de logs et run nécessaires, et assure les permissions pour www-data
mkdir -p /var/log/php-fpm /var/log/nginx /var/log/supervisor /var/run/nginx /var/run/php-fpm
chown -R www-data:www-data /var/log /var/run || true

# Exécute les migrations et cache clearing
php artisan migrate --force || true
php artisan config:cache || true
php artisan view:cache || true

echo "✓ Setup complete, launching supervisord..."

# Lance supervisord
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
