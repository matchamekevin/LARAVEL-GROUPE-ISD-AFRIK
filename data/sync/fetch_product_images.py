#!/usr/bin/env python3
"""Fetch real product images for products that don't have any."""

import os
import re
import sys
import json
import uuid
import time
import subprocess
from datetime import datetime
from io import BytesIO
import requests
from bs4 import BeautifulSoup as BS

DB = "isd_group_afrik"
DB_USER = "root"
DB_HOST = "127.0.0.1"
PGPASSWORD = "root"
IMG_DIR = "/home/kev/Bureau/LARAVEL-GROUPE-ISD-AFRIK/storage/app/public/produits"
os.makedirs(IMG_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
}


def psql(sql):
    """Execute psql and return stdout."""
    env = os.environ.copy()
    env["PGPASSWORD"] = PGPASSWORD
    result = subprocess.run(
        ["psql", "-h", DB_HOST, "-U", DB_USER, "-d", DB, "-At", "-F", "\t", "-c", sql],
        capture_output=True, text=True, env=env,
    )
    return result.stdout.strip()


def psql_insert(sql):
    """Execute INSERT/UPDATE via psql."""
    env = os.environ.copy()
    env["PGPASSWORD"] = PGPASSWORD
    subprocess.run(
        ["psql", "-h", DB_HOST, "-U", DB_USER, "-d", DB, "-c", sql],
        capture_output=True, env=env,
    )


def search_duckduckgo(query, max_retries=2):
    """Search DuckDuckGo image for a product."""
    q = query.replace(" ", "+")
    url = f"https://duckduckgo.com/?q={q}"

    for attempt in range(max_retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=10)
            r.raise_for_status()
            # Extract vqd token
            m = re.search(r'vqd=([^"&]+)', r.text)
            if not m:
                time.sleep(1)
                continue
            vqd = m.group(1)

            img_url = f"https://duckduckgo.com/i.js?q={q}&o=json&vqd={vqd}&p=1&f=,,,"
            r2 = requests.get(img_url, headers={**HEADERS, "Referer": "https://duckduckgo.com/"}, timeout=10)
            r2.raise_for_status()
            data = r2.json()
            for result in data.get("results", []):
                img = result.get("image", "")
                # Skip data URIs and Wikimedia commons
                if img and not img.startswith("data:") and "upload.wikimedia" not in img:
                    return img
        except Exception:
            time.sleep(1)
    return None


def search_amazon(query):
    """Search Amazon for a product image."""
    q = query.replace(" ", "+")
    url = f"https://www.amazon.com/s?k={q}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        r.raise_for_status()
        # Amazon image URL pattern
        matches = re.findall(r'https://m\.media-amazon\.com/images/I/[^"\\]+', r.text)
        for m in matches:
            # Clean up size suffixes
            clean = re.sub(r'\._.*?\.jpg', '.jpg', m)
            clean = re.sub(r'\._.*?\.png', '.png', clean)
            if clean.endswith(('.jpg', '.png', '.webp')):
                return clean
    except Exception:
        pass
    return None


def download_image(url, product_id):
    """Download image, save as webp, return (success, path, size)."""
    local_name = f"prod_{product_id}_{uuid.uuid4().hex[:8]}.webp"
    local_path = f"produits/{local_name}"
    full_path = os.path.join(IMG_DIR, local_name)

    try:
        r = requests.get(url, headers=HEADERS, timeout=15, stream=True)
        r.raise_for_status()
        content_type = r.headers.get("content-type", "")
        if "image" not in content_type:
            return False, "", 0

        with open(full_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

        size = os.path.getsize(full_path)
        if size < 500:
            os.remove(full_path)
            return False, "", 0

        return True, local_path, size
    except Exception:
        if os.path.exists(full_path):
            os.remove(full_path)
        return False, "", 0


def main():
    # Get products without images in target categories
    CATEGORY_SLUGS = [
        "cables-rj45-securite", "fibre-optique-securite", "cables-ethernet",
        "imprimantes-multifonctions", "photocopieuses", "relieuses", "destructeurs-documents",
        "scanners-plat", "scanners-haute-vitesse", "scanners-recto-verso", "scanners-livres", "scanners-portables",
        "appareils-photo-numeriques", "disques-durs-externes",
        "videoprojecteurs", "claviers", "souris", "casques-audio", "imprimantes-laser", "haut-parleurs", "traceurs",
        "tpe-fixe", "tpe-portable", "tpe-mobile", "tpe-smart-android", "tpe-virtuel",
        "drones-loisir", "drones-photographie-video", "drones-industriels",
        "lecteur-badge", "lecteur-empreinte", "lecteur-code", "lecteur-retine", "lecteurs-acces-autre",
        "extincteur-eau", "extincteur-co2", "extincteur-poudre",
    ]

    slugs_str = ",".join(f"'{s}'" for s in CATEGORY_SLUGS)

    rows_raw = psql(f"""
        SELECT p.id_produit, p.titre, p.marque, p.modele, cp.nom
        FROM produits p
        JOIN categories_produits cp ON cp.id_categorie = p.id_categorie
        WHERE cp.slug IN ({slugs_str})
        AND NOT EXISTS (
            SELECT 1 FROM images i
            WHERE i.imageable_type = 'PRODUIT' AND i.imageable_id = p.id_produit
        )
        ORDER BY cp.nom, p.titre;
    """)

    if not rows_raw or not rows_raw.strip():
        print("Tous les produits cibles ont des images!")
        return

    rows = [r.split("\t") for r in rows_raw.strip().split("\n") if r.strip()]
    # Debug: ensure all rows have 5 columns
    for i, row in enumerate(rows):
        if len(row) != 5:
            print(f"WARNING: Row {i} has {len(row)} columns: {row}", file=sys.stderr)
            rows[i] = None
    rows = [r for r in rows if r is not None]
    total = len(rows)
    print(f"Produits à traiter: {total}")

    ok = 0
    fail = 0

    for i, (prod_id, titre, marque, modele, categorie) in enumerate(rows, 1):
        print(f"[{i}/{total}] {categorie}: {titre} ({marque} {modele})... ", end="", flush=True)

        # Build search queries - try from specific to generic
        queries = [
            f"{marque} {modele}",
            f"{titre}",
            f"{marque} {modele} product",
        ]

        image_url = None
        source = ""

        for q in queries:
            # Try DDG
            url = search_duckduckgo(q)
            if url:
                image_url = url
                source = "DuckDuckGo"
                break

            # Try Amazon
            url = search_amazon(q)
            if url:
                image_url = url
                source = "Amazon"
                break

            time.sleep(0.5)

        if not image_url:
            print("FAILED")
            fail += 1
            continue

        success, local_path, size = download_image(image_url, prod_id)
        if not success:
            print("FAILED (download)")
            fail += 1
            continue

        # Save to database
        alt = f"{marque} {modele} - {titre}".replace("'", " ")
        sql = f"""
            INSERT INTO images (id_image, url, path, alt, imageable_type, imageable_id, created_at, updated_at)
            VALUES (gen_random_uuid(), '/storage/{local_path}', '{local_path}',
                    '{alt}', 'PRODUIT', '{prod_id}', NOW(), NOW());
        """
        psql_insert(sql)
        print(f"OK ({source}, {size} bytes)")
        ok += 1

        # Small delay to avoid rate limiting
        time.sleep(0.3)

    print(f"\n=== Résultat: {ok} OK, {fail} FAILED ===")

    remaining = psql(f"""
        SELECT COUNT(*) FROM produits p
        JOIN categories_produits cp ON cp.id_categorie = p.id_categorie
        WHERE cp.slug IN ({slugs_str})
        AND NOT EXISTS (
            SELECT 1 FROM images i
            WHERE i.imageable_type = 'PRODUIT' AND i.imageable_id = p.id_produit
        );
    """)
    print(f"Il reste {remaining} produits sans image dans les catégories cibles.")


if __name__ == "__main__":
    main()
