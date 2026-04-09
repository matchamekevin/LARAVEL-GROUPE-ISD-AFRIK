#!/usr/bin/env bash
set -euo pipefail

# scripts/import_prod.sh
# Import des fichiers CSV (categories, produits) et des images sur le serveur de production.
# Ce script est intentionnellement interactif pour éviter toute suppression non désirée.

DRY_RUN=${DRY_RUN:-0}
PROD_SSH_USER=${PROD_SSH_USER:-}
PROD_HOST=${PROD_HOST:-}
PROD_APP_PATH=${PROD_APP_PATH:-/var/www/html}
IMPORT_DIR=${IMPORT_DIR:-./imports}
REMOTE_TMP=/tmp

info(){ echo "[INFO] $*"; }
err(){ echo "[ERROR] $*" >&2; }
run(){ if [ "$DRY_RUN" = "1" ]; then echo "+ $*"; else eval "$*"; fi }

if [ -z "$PROD_SSH_USER" ] || [ -z "$PROD_HOST" ]; then
  err "Variables PROD_SSH_USER et PROD_HOST obligatoires. Exemple: PROD_SSH_USER=deploy PROD_HOST=prod.example.com"
  exit 2
fi

if [ ! -d "$IMPORT_DIR" ]; then
  err "Dossier d'import non trouvé: ${IMPORT_DIR}"
  exit 2
fi

# Fichiers attendus (personnalisez selon vos exports)
CATEGORIES_CSV="${IMPORT_DIR}/categories.csv"
PRODUCTS_CSV="${IMPORT_DIR}/produits.csv"
IMAGES_DIR="${IMPORT_DIR}/uploads"

info "Vérification des fichiers d'import..."
[ -f "$CATEGORIES_CSV" ] || err "Fichier manquant: $CATEGORIES_CSV" && exit 2
[ -f "$PRODUCTS_CSV" ] || err "Fichier manquant: $PRODUCTS_CSV" && exit 2
[ -d "$IMAGES_DIR" ] || err "Dossier images manquant: $IMAGES_DIR" && exit 2

cat <<EOF
ATTENTION: vous vous apprêtez à importer des données sur la base de production (${PROD_HOST}).
- Un backup préalable doit avoir été réalisé (scripts/backup_prod.sh).
- Ce script transférera les fichiers vers ${PROD_HOST}:${REMOTE_TMP} puis exécutera les commandes psql \copy.

Continuer ? (yes/no)
EOF

read -r CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  info "Import annulé par l'utilisateur. Tapez 'yes' pour confirmer."
  exit 0
fi

TS=$(date +%Y%m%d%H%M%S)
REMOTE_CAT="${REMOTE_TMP}/categories_${TS}.csv"
REMOTE_PROD="${REMOTE_TMP}/produits_${TS}.csv"
REMOTE_UPLOADS_TAR="${REMOTE_TMP}/uploads_import_${TS}.tar.gz"

info "Transfert des fichiers vers le serveur..."
run "scp ${CATEGORIES_CSV} ${PROD_SSH_USER}@${PROD_HOST}:${REMOTE_CAT}"
run "scp ${PRODUCTS_CSV} ${PROD_SSH_USER}@${PROD_HOST}:${REMOTE_PROD}"
run "tar -C ${IMAGES_DIR} -czf /tmp/uploads_import_${TS}.tar.gz -C ${IMAGES_DIR} ."
run "scp /tmp/uploads_import_${TS}.tar.gz ${PROD_SSH_USER}@${PROD_HOST}:${REMOTE_UPLOADS_TAR}"
run "rm -f /tmp/uploads_import_${TS}.tar.gz || true"

# Sur le serveur distant: importer
info "Début de l'import sur le serveur distant (${PROD_HOST})..."
run "ssh ${PROD_SSH_USER}@${PROD_HOST} 'set -e; cd ${PROD_APP_PATH}; \
  # 1) Extraire fichiers
  mv ${REMOTE_CAT} /tmp/ || true; \
  mv ${REMOTE_PROD} /tmp/ || true; \
  mv ${REMOTE_UPLOADS_TAR} /tmp/ || true; \
  tar -C public/uploads -xzf /tmp/uploads_import_${TS}.tar.gz || true; \
  # 2) Import CSV via psql (utilise DATABASE_URL set dans l'environnement)
  if command -v psql >/dev/null 2>&1; then \
    psql "$DATABASE_URL" -c "\copy categories FROM '/tmp/categories_${TS}.csv' CSV HEADER"; \
    psql "$DATABASE_URL" -c "\copy produits FROM '/tmp/produits_${TS}.csv' CSV HEADER"; \
  else \
    echo >&2 "psql non présent sur le serveur"; exit 2; \
  fi; \
  # 3) Nettoyage temp
  rm -f /tmp/categories_${TS}.csv /tmp/produits_${TS}.csv /tmp/uploads_import_${TS}.tar.gz || true; \
  # 4) Clear caches & restart queues
  php artisan storage:link || true; php artisan config:clear || true; php artisan cache:clear || true; php artisan route:cache || true; php artisan view:clear || true; php artisan queue:restart || true'
"

info "Import terminé. Vérifiez les logs et effectuez des contrôles QA." 
info "Exécutez 'php artisan up' si l'application était en maintenance."
