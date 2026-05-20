#!/bin/bash
set -e

# Récupère le port depuis l'env, sinon utilise 10000
PORT=${PORT:-10000}

echo "🚀 Starting application on port $PORT..."

# Defaults sûrs pour Render (évite dépendance DB au boot).
: "${CACHE_STORE:=file}"
: "${CACHE_DRIVER:=${CACHE_STORE}}"
: "${SESSION_DRIVER:=file}"
: "${QUEUE_CONNECTION:=sync}"

# Si des anciennes variables Render forcent encore le cache/sessions en DB, on les neutralise ici.
# Sinon l'app renverra 500 si les tables cache/sessions/jobs ne sont pas migrées.
if [ "${CACHE_STORE}" = "database" ] || [ "${CACHE_DRIVER}" = "database" ]; then
	echo "WARN: CACHE_STORE/CACHE_DRIVER=database en prod -> override en file pour éviter 500 (table cache)." >&2
	export CACHE_STORE=file
	export CACHE_DRIVER=file
fi
if [ "${SESSION_DRIVER}" = "database" ]; then
	echo "WARN: SESSION_DRIVER=database en prod -> override en file pour éviter 500 (table sessions)." >&2
	export SESSION_DRIVER=file
fi

# Forcer LOG_CHANNEL=stderr : les commandes artisan en root créent le fichier
# storage/logs/laravel.log avec root:root, et PHP-FPM (www-data) ne peut plus y écrire.
# stderr envoie les logs vers la sortie standard du conteneur (capturé par Render).
: "${LOG_CHANNEL:=stderr}"
export LOG_CHANNEL

# Forcer le mailer Brevo sur Render.
# L'utilisateur doit configurer BREVO_API_KEY dans les variables d'env Render.
: "${MAIL_MAILER:=brevo}"
export MAIL_MAILER

echo "Effective env: CACHE_STORE=${CACHE_STORE}, SESSION_DRIVER=${SESSION_DRIVER}, QUEUE_CONNECTION=${QUEUE_CONNECTION}, LOG_CHANNEL=${LOG_CHANNEL}, MAIL_MAILER=${MAIL_MAILER}"

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
mkdir -p storage/framework/views storage/framework/cache/data storage/logs
chown -R www-data:www-data storage bootstrap/cache public storage/framework storage/logs || true
chmod -R 0777 storage bootstrap/cache public storage/framework storage/logs || true
# Supprime tout log file existant (créé par root pendant les commandes artisan)
# pour éviter Permission denied quand www-data tente d'y écrire via le handler `single`.
rm -f storage/logs/laravel.log || true

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

# Exécute les migrations si la DB est configurée, sans bloquer le démarrage.
# Nécessaire pour créer les tables Sanctum (personal_access_tokens) et autres.
if [ -n "${DB_CONNECTION:-}" ] || [ -n "${DATABASE_URL:-}" ] || [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
	echo "Running database migrations..."
	php artisan migrate --force 2>/dev/null || echo "WARN: Migration failed (DB may not be ready yet). Continuing..." >&2

	# Seed admin users on first deploy (vérifie si l'admin test existe déjà)
	echo "Seeding admin users if needed..."
	php artisan db:seed --class=UtilisateurSeeder --force 2>/dev/null || true
else
	echo "Skipping migrations (no DB connection configured)"
fi

# Nettoyage + rebuild des caches.
# NOTE: certains drivers (cache/session en database) nécessitent la DB; si la DB/DNS n'est pas prête, on ne doit pas faire tomber le conteneur.
if ! php artisan optimize:clear; then
	echo "WARN: php artisan optimize:clear a échoué (souvent dû à DB_HOST/CACHE_STORE=database). On continue le démarrage." >&2
fi
php artisan package:discover --ansi
php artisan config:cache
php artisan view:cache

# Force PHP-FPM pool to listen on TCP 127.0.0.1:9000 (default www.conf may vary)
PHP_FPM_POOL_CONF="${PHP_FPM_POOL_CONF:-/usr/local/etc/php-fpm.d/zz-render.conf}"
cat > "$PHP_FPM_POOL_CONF" <<'POOLEOF'
[www]
listen = 127.0.0.1:9000
pm = dynamic
pm.max_children = 5
pm.start_servers = 1
pm.min_spare_servers = 1
pm.max_spare_servers = 3
POOLEOF

echo "✓ Setup complete, launching supervisord..."

# Render free tier: ne pas lancer worker/scheduler par défaut.
# (Les activer explicitement quand une queue/cron est configurée.)
ENABLE_QUEUE_WORKER=${ENABLE_QUEUE_WORKER:-false}
ENABLE_SCHEDULER=${ENABLE_SCHEDULER:-false}

SUPERVISOR_CONF=/etc/supervisor/conf.d/supervisord.conf
cat >"$SUPERVISOR_CONF" <<'EOF'
[supervisord]
nodaemon=true
user=root
logfile=/dev/null
logfile_maxbytes=0

[program:php-fpm]
command=/usr/local/sbin/php-fpm -F
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile_maxbytes=0
user=root

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile_maxbytes=0
user=root
EOF

if [ "$ENABLE_QUEUE_WORKER" = "true" ] && [ "${QUEUE_CONNECTION}" != "sync" ]; then
	cat >>"$SUPERVISOR_CONF" <<'EOF'

[program:queue-worker]
command=/usr/local/bin/php /var/www/html/artisan queue:work --sleep=3 --tries=3 --timeout=90 --env=production
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile_maxbytes=0
user=root
EOF
else
	echo "Queue worker disabled (ENABLE_QUEUE_WORKER=$ENABLE_QUEUE_WORKER, QUEUE_CONNECTION=$QUEUE_CONNECTION)" >&2
fi

if [ "$ENABLE_SCHEDULER" = "true" ]; then
	cat >>"$SUPERVISOR_CONF" <<'EOF'

[program:scheduler]
command=/usr/local/bin/php /var/www/html/artisan schedule:work --env=production
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile_maxbytes=0
user=root
EOF
else
	echo "Scheduler disabled (set ENABLE_SCHEDULER=true to enable)" >&2
fi

# Lance supervisord
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
