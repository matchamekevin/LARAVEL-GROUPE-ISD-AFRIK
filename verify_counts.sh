#!/bin/bash
set -euo pipefail
PROD_CONN='postgresql://isd_afrik_db_user:n08Wvqt5LXrSjF83hCvRg3n0qa9TUL6n@dpg-d6qlsrdm5p6s73e5onig-a.oregon-postgres.render.com/isd_afrik_db?sslmode=require'
LOCAL_CONN='postgresql://root:root@127.0.0.1:5432/isd_group_afrik?sslmode=disable'

echo "Using PROD_CONN="$PROD_CONN >&2
echo "Using LOCAL_CONN="$LOCAL_CONN >&2

# get table lists
psql "$PROD_CONN" -At -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;" > prod_tables.txt
psql "$LOCAL_CONN" -At -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;" > local_tables.txt

# counts for prod
: > prod_counts.csv
while IFS= read -r t; do
  cnt=$(psql "$PROD_CONN" -At -c "SELECT count(*) FROM public.\"$t\";") || cnt=0
  echo "$t,$cnt"
done < prod_tables.txt > prod_counts.csv

# counts for local
: > local_counts.csv
while IFS= read -r t; do
  cnt=$(psql "$LOCAL_CONN" -At -c "SELECT count(*) FROM public.\"$t\";") || cnt=0
  echo "$t,$cnt"
done < local_tables.txt > local_counts.csv

sort prod_counts.csv > prod_counts_sorted.csv
sort local_counts.csv > local_counts_sorted.csv
join -t, -a1 -a2 -e0 -o 0,1.2,2.2 prod_counts_sorted.csv local_counts_sorted.csv > counts_merged.csv
awk -F, '{if ($2!=$3) print $1": prod=" $2 " local=" $3; else print $1": ok(" $2 ")" }' counts_merged.csv > compare_counts.txt

echo "Verification complete. Files: prod_counts.csv, local_counts.csv, compare_counts.txt" >&2
