#!/bin/bash
set -euo pipefail
PROD_CONN='postgresql://isd_afrik_db_user:n08Wvqt5LXrSjF83hCvRg3n0qa9TUL6n@dpg-d6qlsrdm5p6s73e5onig-a.oregon-postgres.render.com/isd_afrik_db?sslmode=require'
LOCAL_CONN='postgresql://root:root@127.0.0.1:5432/isd_group_afrik?sslmode=disable'
mkdir -p db_checks
tables=(utilisateurs sessions produits images)
for t in "${tables[@]}"; do
  echo "==== $t ====" > db_checks/${t}_summary.txt
  echo -e "Columns prod:\n" >> db_checks/${t}_summary.txt
  psql "$PROD_CONN" -At -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='$t' ORDER BY ordinal_position;" >> db_checks/${t}_summary.txt || true
  echo -e "\nColumns local:\n" >> db_checks/${t}_summary.txt
  psql "$LOCAL_CONN" -At -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='$t' ORDER BY ordinal_position;" >> db_checks/${t}_summary.txt || true
  echo -e "\nSample prod (first 50 rows):\n" >> db_checks/${t}_summary.txt
  psql "$PROD_CONN" -P footer=off -F'|' -A -c "SELECT * FROM public.\"$t\" LIMIT 50;" >> db_checks/${t}_summary.txt || echo "(error reading prod sample)" >> db_checks/${t}_summary.txt
  echo -e "\nSample local (first 50 rows):\n" >> db_checks/${t}_summary.txt
  psql "$LOCAL_CONN" -P footer=off -F'|' -A -c "SELECT * FROM public.\"$t\" LIMIT 50;" >> db_checks/${t}_summary.txt || echo "(error reading local sample)" >> db_checks/${t}_summary.txt
  psql "$PROD_CONN" -At -c "SELECT id::text FROM public.\"$t\" ORDER BY id;" > db_checks/${t}_prod_ids.txt || true
  psql "$LOCAL_CONN" -At -c "SELECT id::text FROM public.\"$t\" ORDER BY id;" > db_checks/${t}_local_ids.txt || true
  sort -n db_checks/${t}_prod_ids.txt -o db_checks/${t}_prod_ids.txt || true
  sort -n db_checks/${t}_local_ids.txt -o db_checks/${t}_local_ids.txt || true
  comm -23 db_checks/${t}_prod_ids.txt db_checks/${t}_local_ids.txt > db_checks/${t}_prod_only_ids.txt || true
  comm -13 db_checks/${t}_prod_ids.txt db_checks/${t}_local_ids.txt > db_checks/${t}_local_only_ids.txt || true
  echo -e "\nIDs only in prod (first 50):\n" >> db_checks/${t}_summary.txt
  head -n 50 db_checks/${t}_prod_only_ids.txt >> db_checks/${t}_summary.txt || true
  echo -e "\nIDs only in local (first 50):\n" >> db_checks/${t}_summary.txt
  head -n 50 db_checks/${t}_local_only_ids.txt >> db_checks/${t}_summary.txt || true
done
echo "Done"
