#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${OUT_DIR:-$ROOT_DIR/data/db_counts}"
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

PROD_TABLES="$OUT_DIR/prod_tables.txt"
LOCAL_TABLES="$OUT_DIR/local_tables.txt"
PROD_COUNTS="$OUT_DIR/prod_counts.csv"
LOCAL_COUNTS="$OUT_DIR/local_counts.csv"
PROD_SORTED="$OUT_DIR/prod_counts_sorted.csv"
LOCAL_SORTED="$OUT_DIR/local_counts_sorted.csv"
COUNTS_MERGED="$OUT_DIR/counts_merged.csv"
COMPARE_COUNTS="$OUT_DIR/compare_counts.txt"

psql "$PROD_CONN" -At -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;" > "$PROD_TABLES"
psql "$LOCAL_CONN" -At -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;" > "$LOCAL_TABLES"

: > "$PROD_COUNTS"
while IFS= read -r t; do
  cnt=$(psql "$PROD_CONN" -At -c "SELECT count(*) FROM public.\"$t\";") || cnt=0
  echo "$t,$cnt"
done < "$PROD_TABLES" > "$PROD_COUNTS"

: > "$LOCAL_COUNTS"
while IFS= read -r t; do
  cnt=$(psql "$LOCAL_CONN" -At -c "SELECT count(*) FROM public.\"$t\";") || cnt=0
  echo "$t,$cnt"
done < "$LOCAL_TABLES" > "$LOCAL_COUNTS"

sort "$PROD_COUNTS" > "$PROD_SORTED"
sort "$LOCAL_COUNTS" > "$LOCAL_SORTED"
join -t, -a1 -a2 -e0 -o 0,1.2,2.2 "$PROD_SORTED" "$LOCAL_SORTED" > "$COUNTS_MERGED"
awk -F, '{if ($2!=$3) print $1": prod=" $2 " local=" $3; else print $1": ok(" $2 ")" }' "$COUNTS_MERGED" > "$COMPARE_COUNTS"

echo "Verification complete. Output directory: $OUT_DIR" >&2
