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

# Crée les répertoires d'application nécessaires et assure les permissions
mkdir -p storage bootstrap/cache public
chown -R www-data:www-data storage bootstrap/cache public || true

# Rendre les dossiers de cache/writes tolérants pour les environnements de déploiement
# (temporaire/diagnostique) — permet d'éviter les erreurs de chemin de cache Laravel
## Assure l'existence des sous-dossiers attendus par Laravel
mkdir -p storage/framework/views storage/logs
chown -R www-data:www-data storage bootstrap/cache public storage/framework storage/logs || true
chmod -R 0777 storage bootstrap/cache public storage/framework storage/logs || true
# Teste la configuration Nginx pour capturer les erreurs tôt
echo "Testing nginx configuration..."
if ! nginx -t 2>/tmp/nginx_test.err; then
	echo "Nginx configuration test failed:" >&2
	cat /tmp/nginx_test.err >&2 || true
	echo "--- nginx.conf (for debugging) ---" >&2
	sed -n '1,200p' /etc/nginx/conf.d/default.conf >&2 || true
	exit 1
fi

# Exécute les migrations seulement si explicitement demandé (par sécurité en prod)
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
	echo "Running migrations because RUN_MIGRATIONS=true"
	php artisan migrate --force || true
else
	echo "Skipping migrations (set RUN_MIGRATIONS=true to enable)"
fi

# Cache configuration and views (safe to run)
php artisan config:cache || true
php artisan view:cache || true

echo "✓ Setup complete, launching supervisord..."

# Lance supervisord
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
