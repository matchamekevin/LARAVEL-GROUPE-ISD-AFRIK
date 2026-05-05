#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${OUT_DIR:-$ROOT_DIR/data/db_checks}"
mkdir -p "$OUT_DIR"

PROD_CONN="${PROD_CONN:-}"
LOCAL_CONN="${LOCAL_CONN:-}"

if [[ -z "$PROD_CONN" || -z "$LOCAL_CONN" ]]; then
  cat >&2 <<'EOF'
Erreur: variables manquantes.
Définissez PROD_CONN et LOCAL_CONN avant exécution.

Exemple:
  export PROD_CONN='postgresql://user:pass@host:5432/db?sslmode=require'
  export LOCAL_CONN='postgresql://user:pass@127.0.0.1:5432/db?sslmode=disable'
EOF
  exit 1
fi

IFS=',' read -r -a tables <<< "${TABLES:-utilisateurs,sessions,produits,images}"
for t in "${tables[@]}"; do
  summary_file="$OUT_DIR/${t}_summary.txt"
  prod_ids_file="$OUT_DIR/${t}_prod_ids.txt"
  local_ids_file="$OUT_DIR/${t}_local_ids.txt"
  prod_only_file="$OUT_DIR/${t}_prod_only_ids.txt"
  local_only_file="$OUT_DIR/${t}_local_only_ids.txt"

  echo "==== $t ====" > "$summary_file"
  echo -e "Columns prod:\n" >> "$summary_file"
  psql "$PROD_CONN" -At -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='$t' ORDER BY ordinal_position;" >> "$summary_file" || true
  echo -e "\nColumns local:\n" >> "$summary_file"
  psql "$LOCAL_CONN" -At -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='$t' ORDER BY ordinal_position;" >> "$summary_file" || true
  echo -e "\nSample prod (first 50 rows):\n" >> "$summary_file"
  psql "$PROD_CONN" -P footer=off -F'|' -A -c "SELECT * FROM public.\"$t\" LIMIT 50;" >> "$summary_file" || echo "(error reading prod sample)" >> "$summary_file"
  echo -e "\nSample local (first 50 rows):\n" >> "$summary_file"
  psql "$LOCAL_CONN" -P footer=off -F'|' -A -c "SELECT * FROM public.\"$t\" LIMIT 50;" >> "$summary_file" || echo "(error reading local sample)" >> "$summary_file"
  psql "$PROD_CONN" -At -c "SELECT id::text FROM public.\"$t\" ORDER BY id;" > "$prod_ids_file" || true
  psql "$LOCAL_CONN" -At -c "SELECT id::text FROM public.\"$t\" ORDER BY id;" > "$local_ids_file" || true
  sort -n "$prod_ids_file" -o "$prod_ids_file" || true
  sort -n "$local_ids_file" -o "$local_ids_file" || true
  comm -23 "$prod_ids_file" "$local_ids_file" > "$prod_only_file" || true
  comm -13 "$prod_ids_file" "$local_ids_file" > "$local_only_file" || true
  echo -e "\nIDs only in prod (first 50):\n" >> "$summary_file"
  head -n 50 "$prod_only_file" >> "$summary_file" || true
  echo -e "\nIDs only in local (first 50):\n" >> "$summary_file"
  head -n 50 "$local_only_file" >> "$summary_file" || true
done

echo "Done. Output directory: $OUT_DIR"
