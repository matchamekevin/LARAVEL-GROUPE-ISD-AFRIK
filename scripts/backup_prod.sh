#!/usr/bin/env bash
set -euo pipefail

# scripts/backup_prod.sh
# Sauvegarde de la base PostgreSQL et des médias (uploads) depuis le serveur de production
# Usage minimal (exemples):
#   PROD_SSH_USER=deploy PROD_HOST=prod.example.com PROD_APP_PATH=/var/www/html BACKUP_DIR=./backups ./scripts/backup_prod.sh
# Options:
#   DRY_RUN=1 pour ne rien exécuter et afficher les commandes

DRY_RUN=${DRY_RUN:-0}
PROD_SSH_USER=${PROD_SSH_USER:-}
PROD_HOST=${PROD_HOST:-}
PROD_APP_PATH=${PROD_APP_PATH:-/var/www/html}
BACKUP_DIR=${BACKUP_DIR:-./backups}
UPLOADS_PATH=${UPLOADS_PATH:-public/uploads}
REMOTE_TMP=/tmp

timestamp() { date +%Y%m%d%H%M%S; }
info(){ echo "[INFO] $*"; }
err(){ echo "[ERROR] $*" >&2; }
run(){ if [ "$DRY_RUN" = "1" ]; then echo "+ $*"; else eval "$*"; fi }

if [ -z "$PROD_SSH_USER" ] || [ -z "$PROD_HOST" ]; then
  err "Variables PROD_SSH_USER et PROD_HOST obligatoires. Exemple: PROD_SSH_USER=deploy PROD_HOST=prod.example.com"
  exit 2
fi

mkdir -p "$BACKUP_DIR"
TS=$(timestamp)
DB_DUMP_REMOTE="${REMOTE_TMP}/backup_prod_${TS}.dump"
DB_DUMP_LOCAL="${BACKUP_DIR}/backup_prod_${TS}.dump"
UPLOADS_ARCHIVE_REMOTE="${REMOTE_TMP}/uploads_backup_${TS}.tar.gz"
UPLOADS_ARCHIVE_LOCAL="${BACKUP_DIR}/uploads_backup_${TS}.tar.gz"

# 1) Dump PostgreSQL (sur le serveur distant) — nécessite psql/pg_dump sur le serveur
info "Création du dump PostgreSQL sur le serveur distant ($PROD_HOST)..."
run "ssh ${PROD_SSH_USER}@${PROD_HOST} 'set -e; cd ${PROD_APP_PATH}; if command -v pg_dump >/dev/null 2>&1; then pg_dump -Fc \"\$DATABASE_URL\" -f ${DB_DUMP_REMOTE}; else echo >&2 \"pg_dump absent sur le serveur\"; exit 2; fi'"

# Rapporter le dump localement
info "Rapatriement du dump vers ${DB_DUMP_LOCAL}"
run "scp ${PROD_SSH_USER}@${PROD_HOST}:${DB_DUMP_REMOTE} ${DB_DUMP_LOCAL}"

# 2) Sauvegarde médias (uploads)
info "Archivage du dossier ${UPLOADS_PATH} sur le serveur distant..."
run "ssh ${PROD_SSH_USER}@${PROD_HOST} 'set -e; cd ${PROD_APP_PATH}; tar -C ${PROD_APP_PATH} -czf ${UPLOADS_ARCHIVE_REMOTE} ${UPLOADS_PATH}'"
info "Rapatriement de l'archive des uploads vers ${UPLOADS_ARCHIVE_LOCAL}"
run "scp ${PROD_SSH_USER}@${PROD_HOST}:${UPLOADS_ARCHIVE_REMOTE} ${UPLOADS_ARCHIVE_LOCAL}"

# 3) Nettoyage temporaire sur le serveur distant
info "Nettoyage des fichiers temporaires sur le serveur distant"
run "ssh ${PROD_SSH_USER}@${PROD_HOST} 'rm -f ${DB_DUMP_REMOTE} ${UPLOADS_ARCHIVE_REMOTE}' || true"

info "Sauvegarde terminée. Fichiers :"
info "  - DB dump local: ${DB_DUMP_LOCAL}"
info "  - Uploads archive: ${UPLOADS_ARCHIVE_LOCAL}"

cat <<'EOF'
Notes:
- Vérifiez les permissions des archives rapatriées.
- Pour restaurer la DB: utilisez pg_restore --clean --no-owner -d PROD_DB_NAME /path/to/dump
- Les variables sensibles (DATABASE_URL) ne sont pas exposées dans ce script; elles doivent être définies sur le serveur.
EOF
