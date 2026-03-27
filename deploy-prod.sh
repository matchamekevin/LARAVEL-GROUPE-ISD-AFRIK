#!/usr/bin/env bash
set -e

# deploy-prod.sh
# Aide au déploiement sans shell Render payant.
# - vérifie les variables critiques dans .env
# - propose de builder assets et d'exécuter les migrations localement
# - affiche les commandes git à lancer pour déclencher un déploiement sur Render

REQUIRED=("APP_KEY" "RESEND_API_KEY")
DB_VARS=("DB_HOST" "DB_DATABASE" "DB_USERNAME" "DB_PASSWORD")

function has_var() { grep -E "^$1=" .env >/dev/null 2>&1; }

missing=()
for v in "${REQUIRED[@]}"; do
  if ! has_var "$v"; then missing+=("$v"); fi
done

db_missing=()
for v in "${DB_VARS[@]}"; do
  if ! has_var "$v"; then db_missing+=("$v"); fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "Variables obligatoires manquantes dans .env: ${missing[*]}"
fi
if [ ${#db_missing[@]} -gt 0 ]; then
  echo "Variables DB manquantes dans .env: ${db_missing[*]}"
fi
if [ ${#missing[@]} -gt 0 ] || [ ${#db_missing[@]} -gt 0 ]; then
  echo "Complète .env avec les valeurs de production avant de continuer. Abandon."
  exit 1
fi

echo "✔ Variables d'environnement essentielles présentes."

read -p "Construire les assets locaux (npm ci && npm run build) ? (y/N) " build_ans
if [[ $build_ans =~ ^[Yy] ]]; then
  echo "Building frontend assets..."
  npm ci
  npm run build
fi

read -p "Exécuter migrations localement (php artisan migrate --force) ? (y/N) " mig_ans
if [[ $mig_ans =~ ^[Yy] ]]; then
  echo "Running migrations locally..."
  php artisan migrate --force
fi

cat <<'EOF'

PROCHAINE ETAPE: pousser sur la branche configurée pour Render
(Ex: git add . && git commit -m "Deploy" && git push origin main)

Notes importantes:
- render.yaml contient RUN_MIGRATIONS=true -> Render exécutera les migrations au démarrage.
- Nous avons mis QUEUE_CONNECTION=sync pour éviter d'avoir besoin d'un worker payant.
- Si tu obtiens plus tard accès à la shell Render, tu pourras exécuter:

  php artisan migrate --force
  php artisan queue:work --once --tries=3

- Pour vérifier la table jobs via psql / PgAdmin: SELECT COUNT(*) FROM jobs;

EOF

exit 0
