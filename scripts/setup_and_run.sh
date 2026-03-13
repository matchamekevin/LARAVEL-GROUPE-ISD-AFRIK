#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUDO=''
if [ "$EUID" -ne 0 ]; then
  SUDO='sudo'
fi

echo "Repository: $REPO_ROOT"

echo "Fix: dpkg & broken installs (may require sudo)"
$SUDO dpkg --configure -a || true
$SUDO apt --fix-broken install -y || true

echo "Remove known problematic package if present"
$SUDO apt remove --purge -y broadcom-sta-dkms || true

echo "Updating package lists"
$SUDO apt update

echo "Installing system packages (PHP, extensions, tmux, build tools)"
$SUDO apt install -y php-cli php-xml php-mbstring php-curl php-intl php-zip unzip curl git build-essential tmux || true

if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node.js (Nodesource 18.x)"
  curl -fsSL https://deb.nodesource.com/setup_18.x | $SUDO -E bash -
  $SUDO apt install -y nodejs npm || true
fi

if ! command -v composer >/dev/null 2>&1; then
  echo "Installing Composer"
  curl -sS https://getcomposer.org/installer -o composer-setup.php
  $SUDO php composer-setup.php --install-dir=/usr/local/bin --filename=composer
  rm composer-setup.php
fi

cd "$REPO_ROOT"

echo "Running composer install (will retry with ignore flags on failure)"
if ! composer install --no-interaction --prefer-dist --optimize-autoloader; then
  echo "Composer failed; retrying with ignore-platform-reqs"
  composer install --no-interaction --prefer-dist --ignore-platform-req=ext-curl --ignore-platform-req=ext-intl --ignore-platform-req=ext-zip || true
fi

echo "Installing node dependencies"
if [ -f package-lock.json ] || [ -f yarn.lock ]; then
  npm ci || npm install || true
else
  npm install || true
fi

SESSION="afrik"
if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux non trouvé — installation requise pour lancer les commandes en arrière-plan. Vous pouvez exécuter manuellement les commandes si vous ne voulez pas installer tmux."
else
  if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "Creating tmux session '$SESSION' with four windows"
    tmux new-session -d -s "$SESSION" -c "$REPO_ROOT" -n php "php artisan serve --host=127.0.0.1 --port=8000"
    tmux new-window -t "$SESSION:2" -c "$REPO_ROOT" -n npm "npm run dev"
    tmux new-window -t "$SESSION:3" -c "$REPO_ROOT" -n queue "php artisan queue:work"
    tmux new-window -t "$SESSION:4" -c "$REPO_ROOT" -n ngrok "php artisan ngrok http 8000"
    echo "Session créée. Attachez-vous avec: tmux attach -t $SESSION"
  else
    echo "Session tmux '$SESSION' existe déjà. Utilisez: tmux attach -t $SESSION"
  fi
fi

echo "Terminé. Si des étapes ont échoué, relancez le script ou exécutez manuellement les commandes indiquées."
