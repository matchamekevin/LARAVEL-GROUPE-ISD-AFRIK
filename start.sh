#!/usr/bin/env bash
# start.sh — Démarrer le projet Laravel en local (dev)
# Usage: ./start.sh [start|stop|restart|status|logs]
# Par défaut: start

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR" || exit 1

LOG_DIR="$ROOT_DIR/storage/logs"
PIDS_FILE="$LOG_DIR/dev-start.pids"
mkdir -p "$LOG_DIR"

function check_cmd() {
  if command -v "$1" >/dev/null 2>&1; then
    return 0
  fi

  if [ "$1" = "php" ]; then
    cat <<'EOF'
Commande manquante: php.
Ce projet demande PHP 8.2+ en local pour exécuter Laravel.
Exemple Debian/Ubuntu:
  sudo apt update && sudo apt install php8.2 php8.2-cli php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-sqlite3 composer
EOF
  else
    echo "Commande manquante: $1. Installe-la et relance."
  fi
  exit 1
}

function check_php_extensions() {
  local missing_extensions=()
  local php_minor_version

  php_minor_version="$(php -r 'echo PHP_MAJOR_VERSION . "." . PHP_MINOR_VERSION;' 2>/dev/null)"

  for extension in dom simplexml xml xmlreader xmlwriter; do
    if ! php -r "exit(extension_loaded('$extension') ? 0 : 1);" >/dev/null 2>&1; then
      missing_extensions+=("$extension")
    fi
  done

  if [ "${#missing_extensions[@]}" -gt 0 ]; then
    echo "Extensions PHP manquantes: ${missing_extensions[*]}"
    if [ -n "$php_minor_version" ]; then
      echo "Installe le paquet correspondant à ta version PHP, par exemple:"
      echo "  sudo apt install php${php_minor_version}-xml"
      echo "Puis relance ./start.sh"
    else
      echo "Installe l'extension XML/DOM correspondant à ta version PHP, puis relance ./start.sh"
    fi
    exit 1
  fi
}

function check_node_version() {
  local current_node_version required_node_version
  current_node_version="$(node -v 2>/dev/null | sed 's/^v//')"
  required_node_version="20.19.0"

  if [ -z "$current_node_version" ]; then
    echo "Commande manquante: node. Installe Node.js $required_node_version ou plus récent."
    exit 1
  fi

  if [ "$(printf '%s\n%s\n' "$required_node_version" "$current_node_version" | sort -V | head -n1)" != "$required_node_version" ]; then
    echo "Node.js trop ancien: $current_node_version"
    echo "Ce projet requiert Node.js $required_node_version ou plus récent pour Vite 7."
    echo "Installe une version supportée puis relance ./start.sh"
    exit 1
  fi
}

function start() {
  echo "Démarrage du projet dans: $ROOT_DIR"
  # reset pid file
  : > "$PIDS_FILE"

  # Installer dépendances PHP si besoin
  if [ ! -f vendor/autoload.php ]; then
    echo "-> vendor manquant, installation composer..."
    composer install --prefer-dist --no-interaction --no-progress || {
      echo "composer install a échoué"
      exit 1
    }
  fi

  # Installer dépendances JS si besoin
  if [ ! -d node_modules ]; then
    echo "-> node_modules manquant, installation npm..."
    npm install || echo "npm install a échoué"
  fi

  # Nettoyage complet des caches Laravel (config, route, view, events, etc.)
  php artisan optimize:clear || true

  # Nettoyer les fichiers hot Vite stale pour eviter un port/URL faux
  rm -f "$ROOT_DIR/public/hot" "$ROOT_DIR/storage/framework/vite/hot"

  # Optionnel: migrations automatiques (décommenter ou définir AUTO_MIGRATE=true)
  if [ "${AUTO_MIGRATE:-false}" = "true" ]; then
    echo "AUTO_MIGRATE=true -> exécution des migrations"
    php artisan migrate --force
  fi

  # Lancer Vite (dev)
  echo "-> Lancement de Vite (npm run dev)"
  nohup npm run dev > "$LOG_DIR/vite.log" 2>&1 &
  echo $! >> "$PIDS_FILE"
  VITE_DEV_PORT="${VITE_DEV_PORT:-5173}"
  VITE_DEV_SERVER_URL="${VITE_DEV_SERVER_URL:-http://localhost:$VITE_DEV_PORT}"

  # Attendre que Vite soit réellement prêt pour éviter les erreurs "failed to load module"
  # au premier chargement de la page.
  echo "-> Attente disponibilité Vite sur $VITE_DEV_SERVER_URL/@vite/client"
  VITE_READY=false
  for _ in $(seq 1 30); do
    if curl -fsS "$VITE_DEV_SERVER_URL/@vite/client" >/dev/null 2>&1; then
      VITE_READY=true
      break
    fi
    sleep 1
  done
  if [ "$VITE_READY" = true ]; then
    echo "-> Vite prêt."
  else
    echo "-> Avertissement: Vite ne répond pas encore (voir $LOG_DIR/vite.log)."
  fi

  # Lancer le serveur PHP intégré (avec pdo_pgsql si disponible)
  APP_HOST="${APP_HOST:-127.0.0.1}"
  APP_PORT="${APP_PORT:-8000}"
  PHP_PGSQL_EXTRA=""
  if [ -f "$ROOT_DIR/pdo_pgsql.so" ] && [ -f "$ROOT_DIR/pgsql.so" ]; then
    PHP_PGSQL_EXTRA="-d extension=$ROOT_DIR/pdo_pgsql.so -d extension=$ROOT_DIR/pgsql.so"
  fi
  if [ -n "$PHP_PGSQL_EXTRA" ]; then PGSQL_STATUS="oui"; else PGSQL_STATUS="non"; fi
  echo "-> Lancement de 'php -S $APP_HOST:$APP_PORT' (pdo_pgsql: $PGSQL_STATUS)"
  cd "$ROOT_DIR/public" && nohup php $PHP_PGSQL_EXTRA -S "$APP_HOST:$APP_PORT" "$ROOT_DIR/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php" > "$LOG_DIR/artisan-serve.log" 2>&1 &
  echo $! >> "$PIDS_FILE"

  # Lancer le worker de queue seulement si nécessaire
  APP_QUEUE_CONNECTION="${QUEUE_CONNECTION:-}"
  if [ -z "$APP_QUEUE_CONNECTION" ] && [ -f .env ]; then
    APP_QUEUE_CONNECTION="$(grep -E '^QUEUE_CONNECTION=' .env | tail -n 1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  fi
  APP_QUEUE_CONNECTION="${APP_QUEUE_CONNECTION:-database}"

  START_QUEUE_WORKER=true
  if [ "$APP_QUEUE_CONNECTION" = "sync" ]; then
    START_QUEUE_WORKER=false
    echo "-> Worker queue ignoré (QUEUE_CONNECTION=sync)"
  elif [ "$APP_QUEUE_CONNECTION" = "database" ]; then
    JOBS_TABLE_READY="$(php artisan tinker --execute="echo \\Illuminate\\Support\\Facades\\Schema::hasTable(config('queue.connections.database.table', 'jobs')) ? '1' : '0';" 2>/dev/null | tr -d '\r\n\"')"
    if [ "$JOBS_TABLE_READY" != "1" ]; then
      START_QUEUE_WORKER=false
      echo "-> Worker queue ignoré (QUEUE_CONNECTION=database mais table jobs absente)"
    fi
  fi

  if [ "$START_QUEUE_WORKER" = "true" ]; then
    echo "-> Lancement du worker de queue (QUEUE_CONNECTION=$APP_QUEUE_CONNECTION)"
    nohup php artisan queue:work --sleep=3 --tries=3 --timeout=60 > "$LOG_DIR/queue-worker.log" 2>&1 &
    echo $! >> "$PIDS_FILE"
  fi

  # Lancer Reverb (WebSocket server)
  APP_BROADCAST_CONNECTION="${BROADCAST_CONNECTION:-}"
  if [ -z "$APP_BROADCAST_CONNECTION" ] && [ -f .env ]; then
    APP_BROADCAST_CONNECTION="$(grep -E '^BROADCAST_CONNECTION=' .env | tail -n 1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  fi
  if [ "$APP_BROADCAST_CONNECTION" = "reverb" ]; then
    echo "-> Lancement de Reverb (WebSocket)"
    nohup php artisan reverb:start --host=0.0.0.0 --port=8080 --no-interaction > "$LOG_DIR/reverb.log" 2>&1 &
    echo $! >> "$PIDS_FILE"
    echo "-> Reverb démarré sur le port 8080"
  else
    echo "-> Reverb ignoré (BROADCAST_CONNECTION=$APP_BROADCAST_CONNECTION)"
  fi

  # Lancer le scheduler (optionnel)
  echo "-> Lancement du scheduler (schedule:work)"
  nohup php artisan schedule:work > "$LOG_DIR/schedule.log" 2>&1 &
  echo $! >> "$PIDS_FILE"

  echo "Démarrage terminé. PIDs enregistrés dans: $PIDS_FILE"
  echo "Logs disponibles dans: $LOG_DIR"
  echo "PIDs :"
  cat "$PIDS_FILE"
  echo "Utilisez './start.sh logs' pour suivre les logs, './start.sh stop' pour arrêter."
}

function stop() {
  if [ ! -f "$PIDS_FILE" ]; then
    echo "Aucun PID enregistré ($PIDS_FILE introuvable). Rien à arrêter."
    exit 0
  fi
  echo "Arrêt des processus listés dans $PIDS_FILE"
  while read -r pid || [ -n "$pid" ]; do
    if [ -n "$pid" ]; then
      echo "-> kill $pid"
      kill "$pid" 2>/dev/null || true
    fi
  done < "$PIDS_FILE"

  # Nettoyer les fichiers hot Vite stale
  rm -f "$ROOT_DIR/public/hot" "$ROOT_DIR/storage/framework/vite/hot"
  rm -f "$PIDS_FILE"
  echo "Arrêt terminé."
}

function status() {
  if [ ! -f "$PIDS_FILE" ]; then
    echo "Aucun PID enregistré ($PIDS_FILE)."
    exit 0
  fi
  echo "Statut des PIDs dans $PIDS_FILE:"
  while read -r pid || [ -n "$pid" ]; do
    if [ -n "$pid" ]; then
      if ps -p "$pid" > /dev/null; then
        echo "PID $pid: actif"
      else
        echo "PID $pid: arrêté"
      fi
    fi
  done < "$PIDS_FILE"
}

function logs() {
  echo "Affichage des logs (Ctrl-C pour quitter):"
  tail -n 200 -f "$LOG_DIR/vite.log" "$LOG_DIR/artisan-serve.log" "$LOG_DIR/queue-worker.log" "$LOG_DIR/reverb.log" "$LOG_DIR/schedule.log"
}

case "${1:-start}" in
  start)
    check_cmd php
    check_cmd composer
    check_cmd npm
    check_node_version
    check_php_extensions
    start
    ;;
  stop)
    stop
    ;;
  restart)
    stop
    start
    ;;
  status)
    status
    ;;
  logs)
    logs
    ;;
  *)
    echo "Usage: $0 [start|stop|restart|status|logs]"
    exit 1
    ;;
esac
