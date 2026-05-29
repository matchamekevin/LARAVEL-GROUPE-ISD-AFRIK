#!/bin/bash
# Version 2: ciblée uniquement sur les 103 nouveaux produits
# Télécharge 5 images en parallèle

DB="isd_group_afrik"
DB_USER="root"
DB_HOST="127.0.0.1"
export PGPASSWORD="root"
IMG_DIR="/home/kev/Bureau/LARAVEL-GROUPE-ISD-AFRIK/storage/app/public/produits"
mkdir -p "$IMG_DIR"

SLUGS=(
  'cables-rj45-securite' 'fibre-optique-securite' 'cables-ethernet'
  'imprimantes-multifonctions' 'photocopieuses' 'relieuses' 'destructeurs-documents'
  'scanners-plat' 'scanners-haute-vitesse' 'scanners-recto-verso' 'scanners-livres' 'scanners-portables'
  'appareils-photo-numeriques' 'disques-durs-externes'
  'videoprojecteurs' 'claviers' 'souris' 'casques-audio' 'imprimantes-laser' 'haut-parleurs' 'traceurs'
  'tpe-fixe' 'tpe-portable' 'tpe-mobile' 'tpe-smart-android' 'tpe-virtuel'
  'drones-loisir' 'drones-photographie-video' 'drones-industriels'
  'lecteur-badge' 'lecteur-empreinte' 'lecteur-code' 'lecteur-retine' 'lecteurs-acces-autre'
  'extincteur-eau' 'extincteur-co2' 'extincteur-poudre'
)

# Construire la clause IN
IN_CLAUSE=""
for s in "${SLUGS[@]}"; do
  IN_CLAUSE+="'${s}',"
done
IN_CLAUSE="${IN_CLAUSE%,}"

echo "=== Produits cibles ==="
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB" -At -F $'\t' <<SQL > /tmp/products_target.txt
SELECT p.id_produit, p.titre, p.marque, p.modele, cp.nom as categorie
FROM produits p
JOIN categories_produits cp ON cp.id_categorie = p.id_categorie
WHERE cp.slug IN (${IN_CLAUSE})
AND NOT EXISTS (SELECT 1 FROM images i WHERE i.imageable_type = 'PRODUIT' AND i.imageable_id = p.id_produit)
ORDER BY cp.nom, p.titre;
SQL

total=$(wc -l < /tmp/products_target.txt)
echo "Produits à traiter: $total"

if [ "$total" -eq 0 ]; then exit 0; fi

# Fonction: traiter UN produit
process_product() {
    local prod_id="$1"
    local titre="$2"
    local marque="$3"
    local modele="$4"
    local categorie="$5"
    local IMG_DIR="$6"
    local DB="$7"
    local DB_USER="$8"
    local DB_HOST="$9"

    # Trois tentatives de requête
    local queries=()
    queries+=("${marque} ${modele} product")
    queries+=("${titre} ${marque}")
    queries+=("${modele} ${marque}")

    local image_url=""
    local source_name=""

    for q in "${queries[@]}"; do
        image_url=$(duckduckgo_image "$q")
        if [ -n "$image_url" ]; then
            source_name="DuckDuckGo"
            break
        fi

        image_url=$(amazon_image "$q")
        if [ -n "$image_url" ]; then
            source_name="Amazon"
            break
        fi
    done

    if [ -z "$image_url" ]; then
        echo "FAILED|$prod_id|$titre"
        return 1
    fi

    # Télécharger
    local local_name="prod_${prod_id}_$(openssl rand -hex 4).webp"
    local local_path="produits/${local_name}"
    local full_path="${IMG_DIR}/${local_name}"

    if curl -sfL --max-time 15 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$image_url" -o "$full_path" 2>/dev/null; then
        local size=$(stat -c%s "$full_path" 2>/dev/null || echo 0)
        if [ "$size" -gt 500 ]; then
            PGPASSWORD="root" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB" -c "
                INSERT INTO images (id_image, url, path, alt, imageable_type, imageable_id, created_at, updated_at)
                VALUES (gen_random_uuid(), '/storage/${local_path}', '${local_path}',
                        '${marque} ${modele} - ${titre}', 'PRODUIT', '${prod_id}', NOW(), NOW());
            " > /dev/null 2>&1
            echo "OK|$prod_id|$titre|$source_name|${size}bytes"
            return 0
        else
            rm -f "$full_path"
        fi
    fi

    echo "FAILED|$prod_id|$titre"
    return 1
}

# Fonctions de recherche (définies ici pour être exportées)
duckduckgo_image() {
    local query="$1"
    local html vqd json
    html=$(curl -sfL --max-time 8 -A "Mozilla/5.0" "https://duckduckgo.com/?q=$(echo "$query" | sed 's/ /+/g')" 2>/dev/null)
    [ -z "$html" ] && return 1
    vqd=$(echo "$html" | grep -oP 'vqd=[^"&]+' | head -1 | sed 's/vqd=//')
    [ -z "$vqd" ] && return 1
    json=$(curl -sfL --max-time 8 -A "Mozilla/5.0" -H "Referer: https://duckduckgo.com/" \
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
    html=$(curl -sfL --max-time 8 \
        -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
        -H "Accept-Language: en-US,en;q=0.9" \
        "https://www.amazon.com/s?k=$(echo "$query" | sed 's/ /+/g')" 2>/dev/null)
    [ -z "$html" ] && return 1
    echo "$html" | grep -oP 'https://m\.media-amazon\.com/images/I/[^"\\]+' | head -1 | sed 's/\._.*\.jpg/.jpg/' | sed 's/\._.*\.png/.png/'
}

export -f duckduckgo_image amazon_image process_product

echo ""
echo "=== Téléchargement en parallèle (5 threads) ==="

# Utiliser xargs avec 5 processus parallèles
cat /tmp/products_target.txt | xargs -P 5 -I {} bash -c '
    IFS=$'\''\t'\'' read -r prod_id titre marque modele categorie <<< "$(echo "{}")"
    process_product "$prod_id" "$titre" "$marque" "$modele" "$categorie" "$1" "$2" "$3" "$4"
' _ "$IMG_DIR" "$DB" "$DB_USER" "$DB_HOST" 2>&1 | tee /tmp/download_results.txt

echo ""
echo "=== Résultats ==="
ok=$(grep -c "^OK|" /tmp/download_results.txt 2>/dev/null || echo 0)
fail=$(grep -c "^FAILED|" /tmp/download_results.txt 2>/dev/null || echo 0)
echo "OK: $ok, FAILED: $fail"

echo ""
echo "=== Vérification finale ==="
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB" -c "
SELECT COUNT(*) AS cibles_sans_image FROM produits p
JOIN categories_produits cp ON cp.id_categorie = p.id_categorie
WHERE cp.slug IN (${IN_CLAUSE})
AND NOT EXISTS (SELECT 1 FROM images i WHERE i.imageable_type = 'PRODUIT' AND i.imageable_id = p.id_produit);"
