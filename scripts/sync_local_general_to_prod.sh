#!/usr/bin/env bash
set -euo pipefail

timestamp=$(date +%Y%m%d_%H%M%S)
OUT_DIR="$(pwd)/tmp"
mkdir -p "$OUT_DIR"

LOCAL_DSN='postgresql://root:root@127.0.0.1:5432/isd_group_afrik'
PROD_DSN='postgresql://isd_afrik_db_user:n08Wvqt5LXrSjF83hCvRg3n0qa9TUL6n@dpg-d6qlsrdm5p6s73e5onig-a.oregon-postgres.render.com:5432/isd_afrik_db'

PRODUITS_CSV="$OUT_DIR/produits_general_${timestamp}.csv"
IMAGES_CSV="$OUT_DIR/images_general_${timestamp}.csv"
CATEGORIES_CSV="$OUT_DIR/categories_general_${timestamp}.csv"
PROD_PRODUITS_BACKUP="$OUT_DIR/prod_produits_${timestamp}.csv"
PROD_IMAGES_BACKUP="$OUT_DIR/prod_images_${timestamp}.csv"

echo "[1/8] Exporter produits locaux (segment=general) -> $PRODUITS_CSV"
# Exporter sans id_produit : on utilisera uuid pour lier les images en prod
psql "$LOCAL_DSN" -v ON_ERROR_STOP=1 -c "\copy (SELECT p.uuid, p.titre, p.slug, p.reference, p.description, p.description_courte, p.prix, p.prix_promo, p.promo_debut, p.promo_fin, p.stock, p.stock_alerte, p.statut, p.marque, p.modele, p.poids, p.specifications::text, p.garantie, p.est_en_vedette, p.est_nouveau, p.en_promo, p.vues, p.note_moyenne, p.nombre_avis, p.id_categorie, cp.slug AS categorie_slug, p.id_pays, p.id_utilisateur, p.date_creation, p.deleted_at, cp.segment FROM produits p JOIN categories_produits cp ON p.id_categorie = cp.id_categorie WHERE cp.segment = 'general' ORDER BY p.uuid) TO '${PRODUITS_CSV}' WITH CSV HEADER;"

echo "[2/8] Exporter images locales -> $IMAGES_CSV"
# Exporter images avec le UUID du produit pour permettre le mapping en prod
psql "$LOCAL_DSN" -v ON_ERROR_STOP=1 -c "\copy (SELECT i.url, i.path, i.alt, i.imageable_type, p.uuid AS product_uuid, i.created_at, i.updated_at FROM images i JOIN produits p ON i.imageable_type='PRODUIT' AND i.imageable_id = p.id_produit JOIN categories_produits cp ON p.id_categorie = cp.id_categorie WHERE cp.segment='general') TO '${IMAGES_CSV}' WITH CSV HEADER;"

echo "[3/8] Exporter catégories locales utilisées -> $CATEGORIES_CSV"
# Exporter les catégories référencées par les produits 'general' locaux
psql "$LOCAL_DSN" -v ON_ERROR_STOP=1 -c "\copy (SELECT DISTINCT cp.id_categorie, cp.nom, cp.slug, cp.description, cp.icone, cp.image, cp.parent_id, pcp.slug AS parent_slug, cp.ordre, cp.actif, cp.segment, cp.image_url, cp.created_at, cp.updated_at FROM produits p JOIN categories_produits cp ON p.id_categorie = cp.id_categorie LEFT JOIN categories_produits pcp ON cp.parent_id = pcp.id_categorie WHERE cp.segment='general') TO '${CATEGORIES_CSV}' WITH CSV HEADER;"

echo "[4/8] Importer/mettre à jour catégories en prod depuis $CATEGORIES_CSV"
psql "$PROD_DSN" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
DROP TABLE IF EXISTS import_categories;
CREATE TEMP TABLE import_categories AS SELECT * FROM categories_produits LIMIT 0;
-- ajouter parent_slug pour mapping via slug
ALTER TABLE import_categories ADD COLUMN parent_slug text;
\copy import_categories(id_categorie, nom, slug, description, icone, image, parent_id, parent_slug, ordre, actif, segment, image_url, created_at, updated_at) FROM '${CATEGORIES_CSV}' WITH CSV HEADER;
-- Insérer sans parent_id pour éviter violations de FK, on mettra parent_id après
INSERT INTO categories_produits (nom, slug, description, icone, image, ordre, actif, segment, image_url, created_at, updated_at)
SELECT nom, slug, description, icone, image, ordre, actif, segment, image_url, created_at, updated_at
FROM import_categories
ON CONFLICT (slug) DO UPDATE SET
	nom = EXCLUDED.nom,
	description = EXCLUDED.description,
	icone = EXCLUDED.icone,
	image = EXCLUDED.image,
	ordre = EXCLUDED.ordre,
	actif = EXCLUDED.actif,
	segment = EXCLUDED.segment,
	image_url = EXCLUDED.image_url,
	updated_at = EXCLUDED.updated_at;
-- Maintenant affecter les parent_id en fonction du parent_slug importé
UPDATE categories_produits cp
SET parent_id = pc.id_categorie
FROM import_categories ic
LEFT JOIN categories_produits pc ON pc.slug = ic.parent_slug
WHERE cp.slug = ic.slug AND ic.parent_slug IS NOT NULL;
COMMIT;
SQL

echo "[5/8] Sauvegarder prod (tables produits+images) -> $PROD_PRODUITS_BACKUP, $PROD_IMAGES_BACKUP"
psql "$PROD_DSN" -v ON_ERROR_STOP=1 -c "\copy (SELECT * FROM produits) TO '${PROD_PRODUITS_BACKUP}' WITH CSV HEADER;"
psql "$PROD_DSN" -v ON_ERROR_STOP=1 -c "\copy (SELECT * FROM images) TO '${PROD_IMAGES_BACKUP}' WITH CSV HEADER;"

echo "[6/8] Supprimer images et produits 'general' en prod"
psql "$PROD_DSN" -v ON_ERROR_STOP=1 -c "BEGIN; DELETE FROM images WHERE imageable_type='PRODUIT' AND imageable_id IN (SELECT p.id_produit FROM produits p JOIN categories_produits cp ON p.id_categorie=cp.id_categorie WHERE cp.segment='general'); DELETE FROM produits p USING categories_produits cp WHERE p.id_categorie=cp.id_categorie AND cp.segment='general'; COMMIT;"

echo "[5/8] Importer produits sur prod depuis $PRODUITS_CSV"
# Import via table temporaire + upsert sur uuid pour éviter conflits de PK
psql "$PROD_DSN" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
DROP TABLE IF EXISTS import_produits;
CREATE TEMP TABLE import_produits AS SELECT * FROM produits LIMIT 0;
-- Ajouter colonne temporaire pour recevoir le slug de la catégorie depuis l'export local
ALTER TABLE import_produits ADD COLUMN categorie_slug text;
\copy import_produits(uuid, titre, slug, reference, description, description_courte, prix, prix_promo, promo_debut, promo_fin, stock, stock_alerte, statut, marque, modele, poids, specifications, garantie, est_en_vedette, est_nouveau, en_promo, vues, note_moyenne, nombre_avis, id_categorie, categorie_slug, id_pays, id_utilisateur, date_creation, deleted_at, segment) FROM '${PRODUITS_CSV}' WITH CSV HEADER;
-- Supprimer anciens produits 'general' (sécurité) avant insertion
DELETE FROM produits p USING categories_produits cp WHERE p.id_categorie=cp.id_categorie AND cp.segment='general';
-- Upsert depuis import_produits
INSERT INTO produits (uuid, titre, slug, reference, description, description_courte, prix, prix_promo, promo_debut, promo_fin, stock, stock_alerte, statut, marque, modele, poids, specifications, garantie, est_en_vedette, est_nouveau, en_promo, vues, note_moyenne, nombre_avis, id_categorie, id_pays, id_utilisateur, date_creation, deleted_at, segment)
SELECT ip.uuid, ip.titre, ip.slug, ip.reference, ip.description, ip.description_courte, ip.prix, ip.prix_promo, ip.promo_debut, ip.promo_fin, ip.stock, ip.stock_alerte, ip.statut, ip.marque, ip.modele, ip.poids, ip.specifications::jsonb, ip.garantie, ip.est_en_vedette::boolean, ip.est_nouveau::boolean, ip.en_promo::boolean, ip.vues::integer, ip.note_moyenne::numeric, ip.nombre_avis::integer, COALESCE(cp2.id_categorie, ip.id_categorie)::bigint, ip.id_pays::bigint, ip.id_utilisateur::bigint, ip.date_creation::timestamp, ip.deleted_at::timestamp, ip.segment
FROM import_produits ip
LEFT JOIN categories_produits cp2 ON cp2.slug = ip.categorie_slug
ON CONFLICT (uuid) DO UPDATE SET
	titre = EXCLUDED.titre,
	slug = EXCLUDED.slug,
	reference = EXCLUDED.reference,
	description = EXCLUDED.description,
	description_courte = EXCLUDED.description_courte,
	prix = EXCLUDED.prix,
	prix_promo = EXCLUDED.prix_promo,
	promo_debut = EXCLUDED.promo_debut,
	promo_fin = EXCLUDED.promo_fin,
	stock = EXCLUDED.stock,
	stock_alerte = EXCLUDED.stock_alerte,
	statut = EXCLUDED.statut,
	marque = EXCLUDED.marque,
	modele = EXCLUDED.modele,
	poids = EXCLUDED.poids,
	specifications = EXCLUDED.specifications,
	garantie = EXCLUDED.garantie,
	est_en_vedette = EXCLUDED.est_en_vedette,
	est_nouveau = EXCLUDED.est_nouveau,
	en_promo = EXCLUDED.en_promo,
	vues = EXCLUDED.vues,
	note_moyenne = EXCLUDED.note_moyenne,
	nombre_avis = EXCLUDED.nombre_avis,
	id_categorie = EXCLUDED.id_categorie,
	id_pays = EXCLUDED.id_pays,
	id_utilisateur = EXCLUDED.id_utilisateur,
	date_creation = EXCLUDED.date_creation,
	deleted_at = EXCLUDED.deleted_at,
	segment = EXCLUDED.segment;
COMMIT;
SQL

echo "[6/8] Importer images sur prod depuis $IMAGES_CSV (mapping via product uuid)"
# Importer images dans une table temporaire puis mapper product_uuid -> id_produit
psql "$PROD_DSN" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
DROP TABLE IF EXISTS import_images;
CREATE TEMP TABLE import_images (url text, path text, alt text, imageable_type text, product_uuid uuid, created_at timestamp, updated_at timestamp);
\copy import_images FROM '${IMAGES_CSV}' WITH CSV HEADER;
-- Inserer images en liant product_uuid -> id_produit
INSERT INTO images (url, path, alt, imageable_type, imageable_id, created_at, updated_at)
SELECT ii.url, ii.path, ii.alt, ii.imageable_type, p.id_produit, ii.created_at, ii.updated_at
FROM import_images ii
JOIN produits p ON p.uuid = ii.product_uuid
WHERE ii.imageable_type = 'PRODUIT';
COMMIT;
SQL

echo "Mettre à jour la séquence images.id_image"
psql "$PROD_DSN" -v ON_ERROR_STOP=1 -c "SELECT setval(pg_get_serial_sequence('images','id_image'), (SELECT COALESCE(MAX(id_image), 1) FROM images));"

echo "[7/8] Mettre à jour la séquence id_produit"
psql "$PROD_DSN" -v ON_ERROR_STOP=1 -c "SELECT setval(pg_get_serial_sequence('produits','id_produit'), (SELECT COALESCE(MAX(id_produit), 1) FROM produits));"

echo "[8/8] Vérifier les comptes"
psql "$PROD_DSN" -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) AS total_general FROM produits p JOIN categories_produits cp ON p.id_categorie=cp.id_categorie WHERE cp.segment='general'; SELECT COUNT(*) AS images_count FROM images WHERE imageable_type='PRODUIT' AND imageable_id IN (SELECT p.id_produit FROM produits p JOIN categories_produits cp ON p.id_categorie=cp.id_categorie WHERE cp.segment='general');"

echo "Terminé. CSVs: $PRODUITS_CSV, $IMAGES_CSV ; backups: $PROD_PRODUITS_BACKUP, $PROD_IMAGES_BACKUP"
