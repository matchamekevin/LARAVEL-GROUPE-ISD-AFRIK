#!/bin/bash
# Dernière tentative pour les 33 produits sans image
set +e

DB="isd_group_afrik"
DB_USER="root"
DB_HOST="127.0.0.1"
export PGPASSWORD="root"
IMG_DIR="/home/kev/Bureau/LARAVEL-GROUPE-ISD-AFRIK/storage/app/public/produits"
mkdir -p "$IMG_DIR"

# Récupérer les 33 produits restants
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB" -At -F $'\t' <<'SQL' > /tmp/products_remaining.txt
SELECT p.id_produit, p.titre, p.marque, p.modele, cp.nom as categorie
FROM produits p
JOIN categories_produits cp ON cp.id_categorie = p.id_categorie
WHERE NOT EXISTS (SELECT 1 FROM images i WHERE i.imageable_type = 'PRODUIT' AND i.imageable_id = p.id_produit)
AND p.id_produit NOT IN (SELECT i.imageable_id FROM images i WHERE i.imageable_type = 'PRODUIT')
ORDER BY cp.nom, p.titre;
SQL

total=$(wc -l < /tmp/products_remaining.txt)
echo "Produits restants: $total"

if [ "$total" -eq 0 ]; then
    echo "Terminé! Tous les produits ont des images."
    exit 0
fi

cat /tmp/products_remaining.txt

# Fonctions de recherche
duckduckgo_image() {
    local query="$1"
    local html vqd json result
    # URL-encoder simple
    local encoded=$(echo "$query" | sed 's/ /+/g;s/é/e/g;s/è/e/g;s/ê/e/g;s/à/a/g;s/ç/c/g;s/ô/o/g;s/î/i/g;s/ï/i/g;s/ü/u/g')
    html=$(curl -sfL --max-time 10 -A "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0" \
        "https://duckduckgo.com/?q=${encoded}" 2>/dev/null)
    [ -z "$html" ] && return 1
    vqd=$(echo "$html" | grep -oP 'vqd=[^"&]+' | head -1 | sed 's/vqd=//')
    [ -z "$vqd" ] && return 1
    json=$(curl -sfL --max-time 10 \
        -A "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0" \
        -H "Referer: https://duckduckgo.com/" \
        "https://duckduckgo.com/i.js?q=${encoded}&o=json&vqd=${vqd}&p=1&f=,,," 2>/dev/null)
    [ -z "$json" ] && return 1
    result=$(echo "$json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for r in data.get('results', []):
        img = r.get('image', '')
        if img and not img.startswith('data:') and not img.startswith('https://upload.wikimedia.org/wikipedia/commons/'):
            print(img)
            sys.exit(0)
except: pass
" 2>/dev/null)
    [ -n "$result" ] && echo "$result" && return 0
    return 1
}

amazon_image() {
    local query="$1"
    local html src
    local encoded=$(echo "$query" | sed 's/ /+/g')
    html=$(curl -sfL --max-time 10 \
        -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
        -H "Accept-Language: en-US,en;q=0.9" \
        "https://www.amazon.com/s?k=${encoded}" 2>/dev/null)
    [ -z "$html" ] && return 1
    src=$(echo "$html" | grep -oP 'https://m\.media-amazon\.com/images/I/[^"\\]+' | head -1 | sed 's/\._.*\.jpg/.jpg/' | sed 's/\._.*\.png/.png/')
    [ -n "$src" ] && echo "$src" && return 0
    return 1
}

google_image() {
    local query="$1"
    local encoded=$(echo "$query" | sed 's/ /+/g')
    local html img
    html=$(curl -sfL --max-time 10 \
        -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
        "https://www.google.com/search?tbm=isch&q=${encoded}" 2>/dev/null)
    [ -z "$html" ] && return 1
    img=$(echo "$html" | grep -oP '"https://[^"]+\.(jpg|jpeg|png|webp)[^"]*"' | head -1 | tr -d '"')
    [ -n "$img" ] && echo "$img" && return 0
    return 1
}

echo ""
echo "=== Tentatives pour chaque produit ==="
echo ""

downloaded=0
failed=0

while IFS=$'\t' read -r prod_id titre marque modele categorie; do
    echo -n "→ $titre ($marque $modele)... "

    image_url=""
    source_name=""

    # Construire les requêtes
    queries=()
    queries+=("${marque} ${modele}")
    queries+=("${titre} ${marque}")
    queries+=("${modele} ${marque} product")
    queries+=("${titre}")

    for q in "${queries[@]}"; do
        image_url=$(duckduckgo_image "$q" 2>/dev/null)
        if [ -n "$image_url" ]; then
            source_name="DuckDuckGo"
            break
        fi
        image_url=$(amazon_image "$q" 2>/dev/null)
        if [ -n "$image_url" ]; then
            source_name="Amazon"
            break
        fi
    done

    if [ -z "$image_url" ]; then
        echo "ÉCHEC"
        failed=$((failed+1))
        continue
    fi

    # Télécharger
    local_name="prod_${prod_id}_$(openssl rand -hex 4).webp"
    local_path="produits/${local_name}"
    full_path="${IMG_DIR}/${local_name}"

    if curl -sfL --max-time 15 \
        -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
        "$image_url" -o "$full_path" 2>/dev/null; then
        size=$(stat -c%s "$full_path" 2>/dev/null || echo 0)
        if [ "$size" -gt 500 ]; then
            PGPASSWORD="root" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB" -c "
                INSERT INTO images (id_image, url, path, alt, imageable_type, imageable_id, created_at, updated_at)
                VALUES (gen_random_uuid(), '/storage/${local_path}', '${local_path}',
                        '${marque} ${modele} - ${titre}', 'PRODUIT', '${prod_id}', NOW(), NOW());
            " > /dev/null 2>&1
            echo "OK ($source_name, ${size} bytes)"
            downloaded=$((downloaded+1))
        else
            rm -f "$full_path"
            echo "ÉCHEC (fichier vide)"
            failed=$((failed+1))
        fi
    else
        echo "ÉCHEC (téléchargement)"
        failed=$((failed+1))
    fi
done < /tmp/products_remaining.txt

echo ""
echo "=== Bilan ==="
echo "Téléchargées: $downloaded"
echo "Échouées: $failed"
echo ""
echo "=== Produits encore sans image ==="
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB" -c "
SELECT COUNT(*) AS restants FROM produits p
WHERE NOT EXISTS (SELECT 1 FROM images i WHERE i.imageable_type = 'PRODUIT' AND i.imageable_id = p.id_produit);"
