#!/bin/bash
# Télécharge les vraies images de produits depuis DuckDuckGo/Amazon
# Usage: bash download_real_images.sh
set +e  # on gère les erreurs manuellement

DB="isd_group_afrik"
DB_USER="root"
DB_HOST="127.0.0.1"
export PGPASSWORD="root"

IMG_DIR="/home/kev/Bureau/LARAVEL-GROUPE-ISD-AFRIK/storage/app/public/produits"
mkdir -p "$IMG_DIR"
cd /tmp || exit 1

# ============== FONCTIONS ==============

duckduckgo_image() {
    local query="$1"
    local html vqd json

    html=$(curl -sfL --max-time 10 -A "Mozilla/5.0" "https://duckduckgo.com/?q=$(echo "$query" | sed 's/ /+/g')" 2>/dev/null)
    [ -z "$html" ] && return 1

    vqd=$(echo "$html" | grep -oP 'vqd=[^"&]+' | head -1 | sed 's/vqd=//')
    [ -z "$vqd" ] && return 1

    json=$(curl -sfL --max-time 10 \
        -A "Mozilla/5.0" \
        -H "Referer: https://duckduckgo.com/" \
        "https://duckduckgo.com/i.js?q=$(echo "$query" | sed 's/ /+/g')&o=json&vqd=${vqd}&p=1&f=,,," 2>/dev/null)

    [ -z "$json" ] && return 1

    echo "$json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for r in data.get('results', []):
        img = r.get('image', '')
        if img and not img.startswith('data:'):
            print(img)
            sys.exit(0)
except: pass
" 2>/dev/null
}

amazon_image() {
    local query="$1"
    local html

    html=$(curl -sfL --max-time 10 \
        -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
        -H "Accept-Language: en-US,en;q=0.9" \
        "https://www.amazon.com/s?k=$(echo "$query" | sed 's/ /+/g')" 2>/dev/null)

    [ -z "$html" ] && return 1

    echo "$html" | grep -oP 'https://m\.media-amazon\.com/images/I/[^"\\]+' | head -1 | sed 's/\._.*\.jpg/.jpg/' | sed 's/\._.*\.png/.png/'
}

# ============== DÉBUT ==============

echo "=== Nettoyage des anciennes images orphelines ==="
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB" -c "DELETE FROM images WHERE imageable_type = 'PRODUIT' AND url LIKE '%/storage/produits/prod_%';" 2>/dev/null
rm -f "$IMG_DIR"/prod_*.webp 2>/dev/null
echo "Nettoyage terminé."

echo "=== Récupération des produits sans image ==="

psql -h "$DB_HOST" -U "$DB_USER" -d "$DB" -At -F $'\t' << 'SQL' > /tmp/products_no_image.txt
SELECT p.id_produit, p.titre, p.marque, p.modele, cp.nom as categorie
FROM produits p
JOIN categories_produits cp ON cp.id_categorie = p.id_categorie
WHERE NOT EXISTS (
    SELECT 1 FROM images i WHERE i.imageable_type = 'PRODUIT' AND i.imageable_id = p.id_produit
)
AND cp.segment = 'general'
ORDER BY cp.nom, p.titre;
SQL

total=$(wc -l < /tmp/products_no_image.txt)
echo "Produits sans image: $total"

if [ "$total" -eq 0 ]; then
    echo "Rien à faire."
    exit 0
fi

downloaded=0
failed=0

while IFS=$'\t' read -r prod_id titre marque modele categorie; do
    query="$marque $modele"
    image_url=""
    source_name=""

    echo -n "[$((downloaded+failed+1))/$total] $categorie: $titre ($query)... "

    # Stratégie 1: DuckDuckGo
    image_url=$(duckduckgo_image "$query")
    if [ -n "$image_url" ]; then
        source_name="DuckDuckGo"
    fi

    # Stratégie 2: Amazon
    if [ -z "$image_url" ]; then
        image_url=$(amazon_image "$query")
        if [ -n "$image_url" ]; then
            source_name="Amazon"
        fi
    fi

    # Téléchargement
    if [ -n "$image_url" ]; then
        local_name="prod_${prod_id}_$(openssl rand -hex 4).webp"
        local_path="produits/${local_name}"
        full_path="${IMG_DIR}/${local_name}"

        if curl -sfL --max-time 15 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$image_url" -o "$full_path" 2>/dev/null; then
            size=$(stat -c%s "$full_path" 2>/dev/null || echo 0)
            if [ "$size" -gt 500 ]; then
                psql -h "$DB_HOST" -U "$DB_USER" -d "$DB" -c "
                    INSERT INTO images (id_image, url, path, alt, imageable_type, imageable_id, created_at, updated_at)
                    VALUES (gen_random_uuid(), '/storage/${local_path}', '${local_path}',
                            '${marque} ${modele} - ${titre}', 'PRODUIT', '${prod_id}', NOW(), NOW());
                " > /dev/null 2>&1
                echo "OK ($source_name, ${size} bytes)"
                downloaded=$((downloaded+1))
                continue
            else
                rm -f "$full_path"
            fi
        fi
    fi

    echo "FAILED"
    failed=$((failed+1))

done < /tmp/products_no_image.txt

echo ""
echo "=== Terminé ==="
echo "Téléchargées: $downloaded"
echo "Échouées: $failed"
echo ""
echo "Vérification finale:"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB" -c "
    SELECT COUNT(*) AS sans_image FROM produits p
    JOIN categories_produits cp ON cp.id_categorie = p.id_categorie
    WHERE cp.segment = 'general' AND NOT EXISTS (SELECT 1 FROM images i WHERE i.imageable_type = 'PRODUIT' AND i.imageable_id = p.id_produit);"
