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
  command -v "$1" >/dev/null 2>&1 || { echo "Commande manquante: $1. Installe-la et relance."; exit 1; }
}

function start() {
  echo "Démarrage du projet dans: $ROOT_DIR"
  # reset pid file
  : > "$PIDS_FILE"

  # Installer dépendances PHP si besoin
  if [ ! -f vendor/autoload.php ]; then
    echo "-> vendor manquant, installation composer..."
    composer install --prefer-dist --no-interaction --no-progress || echo "composer install a échoué"
  fi

  # Installer dépendances JS si besoin
  if [ ! -d node_modules ]; then
    echo "-> node_modules manquant, installation npm..."
    npm install || echo "npm install a échoué"
  fi

  # Clear & cache
  php artisan config:clear || true
  php artisan cache:clear || true
  php artisan view:clear || true
  php artisan route:clear || true

  # Optionnel: migrations automatiques (décommenter ou définir AUTO_MIGRATE=true)
  if [ "${AUTO_MIGRATE:-false}" = "true" ]; then
    echo "AUTO_MIGRATE=true -> exécution des migrations"
    php artisan migrate --force
  fi

  # Lancer Vite (dev)
  echo "-> Lancement de Vite (npm run dev)"
  nohup npm run dev > "$LOG_DIR/vite.log" 2>&1 &
  echo $! >> "$PIDS_FILE"

  # Lancer le serveur PHP intégré
  APP_HOST="${APP_HOST:-127.0.0.1}"
  APP_PORT="${APP_PORT:-8000}"
  echo "-> Lancement de 'php artisan serve --host=$APP_HOST --port=$APP_PORT'"
  nohup php artisan serve --host="$APP_HOST" --port="$APP_PORT" > "$LOG_DIR/artisan-serve.log" 2>&1 &
  echo $! >> "$PIDS_FILE"

  # Lancer le worker de queue
  echo "-> Lancement du worker de queue"
  nohup php artisan queue:work --sleep=3 --tries=3 --timeout=60 > "$LOG_DIR/queue-worker.log" 2>&1 &
  echo $! >> "$PIDS_FILE"

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
  tail -n 200 -f "$LOG_DIR/vite.log" "$LOG_DIR/artisan-serve.log" "$LOG_DIR/queue-worker.log" "$LOG_DIR/schedule.log"
}

case "${1:-start}" in
  start)
    check_cmd php
    check_cmd composer
    check_cmd npm
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
