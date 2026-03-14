#!/bin/bash
set -e

echo "==> Starting Laravel application..."

# Display PHP version
php -v

# Run migrations if DATABASE_URL is set, but don't fail if they error
if [ -n "$DATABASE_URL" ]; then
    echo "==> Attempting to run database migrations..."
    php artisan migrate --force || echo "⚠️  Migrations failed or database unavailable. Continuing anyway."
else
    echo "⚠️  DATABASE_URL not set. Skipping migrations. Set DATABASE_URL in environment to enable."
fi

# Cache configuration
php artisan config:cache || true

# Start supervisor to run nginx and php-fpm
echo "==> Starting supervisor..."
/usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
