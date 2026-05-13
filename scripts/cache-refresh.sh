#!/bin/bash

# Cache Refresh & Optimization Script
# Run this periodically to clear stale caches and refresh the application

set -e

PROJECT_ROOT="/home/kev/Desktop/PROJET_ISD_AFRIK_BACKEND-2"
cd "$PROJECT_ROOT"

echo "🧹 Clearing Laravel Caches..."
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear

echo "📁 Removing cache files..."
rm -rf storage/framework/cache/*
rm -rf bootstrap/cache/*

echo "🔄 Warming up caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "✅ Cache refresh completed successfully!"
echo ""
echo "Application is ready. Cache system has been optimized."
