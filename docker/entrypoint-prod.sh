#!/bin/bash
set -e

# Récupère le port depuis l'env, sinon utilise 10000
PORT=${PORT:-10000}

echo "🚀 Starting application on port $PORT..."

# Rendre les logs PHP visibles dans les logs Render (stderr)
export PHP_FPM_LOG_LEVEL=${PHP_FPM_LOG_LEVEL:-notice}

# Vérification hard-fail des variables critiques: évite un 500 silencieux.
if [ -z "${APP_KEY:-}" ] || [[ "${APP_KEY}" == "base64:REPLACE_WITH_YOUR_APP_KEY" ]]; then
	echo "ERROR: APP_KEY est manquant ou vaut un placeholder."
	echo "- Dans Render: Settings -> Environment -> ajoute APP_KEY (commande locale: php artisan key:generate --show)"
	echo "- Exemple: base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx="
	exit 1
fi

# Remplace le port dans la config Nginx (IPv4 et IPv6)
sed -i "s/listen 0.0.0.0:10000;/listen 0.0.0.0:$PORT;/" /etc/nginx/conf.d/default.conf
# Remplace aussi la ligne IPv6 en conservant la forme '[::]:PORT'
sed -i "s/listen \[::\]:10000;/listen [::]:$PORT;/" /etc/nginx/conf.d/default.conf

# Crée les répertoires de logs et run nécessaires, et assure les permissions pour www-data
mkdir -p /var/log/php-fpm /var/log/nginx /var/log/supervisor /var/run/nginx /var/run/php-fpm
chown -R www-data:www-data /var/log /var/run || true

# Crée les répertoires d'application nécessaires et assure les permissions
mkdir -p storage storage/app/public bootstrap/cache public
chown -R www-data:www-data storage bootstrap/cache public || true

# Rendre les dossiers de cache/writes tolérants pour les environnements de déploiement
# (temporaire/diagnostique) — permet d'éviter les erreurs de chemin de cache Laravel
## Assure l'existence des sous-dossiers attendus par Laravel
mkdir -p storage/framework/views storage/logs
chown -R www-data:www-data storage bootstrap/cache public storage/framework storage/logs || true
chmod -R 0777 storage bootstrap/cache public storage/framework storage/logs || true

# Supprime les caches commités / obsolètes (cause fréquente de 500 en prod quand --no-dev).
rm -f bootstrap/cache/*.php || true

# Expose les uploads Laravel via /storage en prod.
# Sans ce lien symbolique, les URLs d'images uploadées retombent sur la SPA.
if [ ! -L public/storage ] && [ ! -e public/storage ]; then
	php artisan storage:link || true
fi
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

# Nettoyage + rebuild des caches. Si ça échoue, on préfère le voir dans les logs (et redémarrer) plutôt que servir un 500.
php artisan optimize:clear
php artisan package:discover --ansi
php artisan config:cache
php artisan view:cache

echo "✓ Setup complete, launching supervisord..."

# Lance supervisord
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
