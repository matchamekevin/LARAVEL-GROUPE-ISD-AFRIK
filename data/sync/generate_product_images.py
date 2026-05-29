#!/usr/bin/env python3
"""Generate clean product images for remaining products using Pillow."""

import os
import sys
import uuid
import subprocess
from PIL import Image, ImageDraw, ImageFont

DB = "isd_group_afrik"
DB_USER = "root"
DB_HOST = "127.0.0.1"
PGPASSWORD = "root"
IMG_DIR = "/home/kev/Bureau/LARAVEL-GROUPE-ISD-AFRIK/storage/app/public/produits"
os.makedirs(IMG_DIR, exist_ok=True)

# Color palettes per category for visual variety
CAT_COLORS = {
    "Autres lecteurs": ("#2C3E50", "#3498DB"),
    "Câbles Ethernet": ("#27AE60", "#2ECC71"),
    "Casques audio": ("#8E44AD", "#9B59B6"),
    "Claviers": ("#E67E22", "#F39C12"),
    "Disques durs externes": ("#2980B9", "#3498DB"),
    "🧭 Drones de loisir (grand public)": ("#1ABC9C", "#16A085"),
    "🏭 Drones industriels": ("#34495E", "#2C3E50"),
    "Extincteur Eau": ("#E74C3C", "#C0392B"),
    "Extincteur Poudre": ("#D35400", "#E67E22"),
    "Fibre optique": ("#3498DB", "#2980B9"),
    "Haut-parleurs": ("#9B59B6", "#8E44AD"),
    "Imprimantes multifonctions": ("#2C3E50", "#34495E"),
    "Lecteur à la rétine": ("#16A085", "#1ABC9C"),
    "Relieuses": ("#7F8C8D", "#95A5A6"),
    "Scanners à plat": ("#2980B9", "#3498DB"),
    "Scanners de livres": ("#8E44AD", "#9B59B6"),
    "Scanners portables": ("#27AE60", "#2ECC71"),
    "Scanners recto-verso": ("#E67E22", "#F39C12"),
    "Souris": ("#2C3E50", "#7F8C8D"),
    "🏪 TPE fixe (filaire)": ("#C0392B", "#E74C3C"),
    "📱 TPE mobile (GPRS/4G)": ("#D35400", "#E67E22"),
    "📶 TPE portable": ("#2980B9", "#3498DB"),
    "🌐 TPE virtuel (e-TPE)": ("#16A085", "#1ABC9C"),
    "Traceurs": ("#34495E", "#2C3E50"),
    "": ("#636e72", "#b2bec3"),
}


def generate_product_image(prod_id, titre, marque, modele, categorie):
    """Generate a clean 800x800 product image."""
    cat = categorie.strip()
    c1, c2 = CAT_COLORS.get(cat, ("#636e72", "#b2bec3"))

    # Parse hex colors
    r1, g1, b1 = int(c1[1:3], 16), int(c1[3:5], 16), int(c1[5:7], 16)
    r2, g2, b2 = int(c2[1:3], 16), int(c2[3:5], 16), int(c2[5:7], 16)

    img = Image.new("RGB", (800, 800))
    draw = ImageDraw.Draw(img)

    # Draw gradient background
    for y in range(800):
        ratio = y / 800
        r = int(r1 + (r2 - r1) * ratio)
        g = int(g1 + (g2 - g1) * ratio)
        b = int(b1 + (b2 - b1) * ratio)
        for x in range(800):
            img.putpixel((x, y), (r, g, b))

    # Draw subtle geometric pattern
    draw = ImageDraw.Draw(img)
    for i in range(0, 800, 40):
        alpha = 10
        draw.line([(0, i), (i, 0)], fill=(255, 255, 255, alpha), width=1)
        draw.line([(800, i), (800 - i, 0)], fill=(255, 255, 255, alpha), width=1)

    # Draw product "silhouette" - a rounded rectangle suggesting a product
    box_color = (255, 255, 255, 30)
    draw.rounded_rectangle([(200, 200), (600, 500)], radius=30,
                          fill=(255, 255, 255, 20), outline=(255, 255, 255, 60), width=3)

    # Try to load fonts, fall back to default
    font_large = None
    font_med = None
    font_small = None

    for size, attr in [(36, "font_large"), (24, "font_med"), (18, "font_small")]:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
        except (IOError, OSError):
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)
            except (IOError, OSError):
                font = ImageFont.load_default()
        globals()[attr] = font

    if font_large is None:
        font_large = ImageFont.load_default()
    if font_med is None:
        font_med = ImageFont.load_default()
    if font_small is None:
        font_small = ImageFont.load_default()

    # Draw brand label
    brand_text = f"{marque} {modele}"
    try:
        bbox = draw.textbbox((0, 0), brand_text, font=font_med)
        tw = bbox[2] - bbox[0]
        draw.text(((800 - tw) / 2, 250), brand_text, fill=(255, 255, 255, 220), font=font_med)
    except Exception:
        pass

    # Draw product title (truncated if needed)
    title = titre if len(titre) < 30 else titre[:27] + "..."
    try:
        bbox = draw.textbbox((0, 0), title, font=font_large)
        tw = bbox[2] - bbox[0]
        draw.text(((800 - tw) / 2, 300), title, fill=(255, 255, 255), font=font_large)
    except Exception:
        pass

    # Draw category tag
    try:
        cat_text = f"Catégorie: {cat}"
        bbox = draw.textbbox((0, 0), cat_text, font=font_small)
        tw = bbox[2] - bbox[0]
        draw.text(((800 - tw) / 2, 360), cat_text, fill=(255, 255, 255, 150), font=font_small)
    except Exception:
        pass

    # Save
    local_name = f"prod_{prod_id}_{uuid.uuid4().hex[:8]}.webp"
    local_path = f"produits/{local_name}"
    full_path = os.path.join(IMG_DIR, local_name)
    img.save(full_path, "WEBP", quality=85)

    size = os.path.getsize(full_path)
    return local_path, size


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
    env = os.environ.copy()
    env["PGPASSWORD"] = PGPASSWORD
    subprocess.run(
        ["psql", "-h", DB_HOST, "-U", DB_USER, "-d", DB, "-c", sql],
        capture_output=True, env=env,
    )


def main():
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
    total = len(rows)
    print(f"Génération d'images pour {total} produits...")

    for i, row in enumerate(rows, 1):
        if len(row) != 5:
            print(f"[{i}/{total}] ERREUR: ligne invalide: {row}")
            continue
        prod_id, titre, marque, modele, categorie = row
        print(f"[{i}/{total}] {categorie}: {titre} ({marque} {modele})... ", end="", flush=True)

        try:
            local_path, size = generate_product_image(prod_id, titre, marque, modele, categorie)
            alt = f"{marque} {modele} - {titre}".replace("'", " ")
            psql_insert(f"""
                INSERT INTO images (id_image, url, path, alt, imageable_type, imageable_id, created_at, updated_at)
                VALUES (gen_random_uuid(), '/storage/{local_path}', '{local_path}',
                        '{alt}', 'PRODUIT', '{prod_id}', NOW(), NOW());
            """)
            print(f"OK ({size} bytes)")
        except Exception as e:
            print(f"ERREUR: {e}")

    remaining = psql(f"""
        SELECT COUNT(*) FROM produits p
        JOIN categories_produits cp ON cp.id_categorie = p.id_categorie
        WHERE cp.slug IN ({slugs_str})
        AND NOT EXISTS (
            SELECT 1 FROM images i
            WHERE i.imageable_type = 'PRODUIT' AND i.imageable_id = p.id_produit
        );
    """)
    print(f"\nIl reste {remaining} produits sans image dans les catégories cibles.")


if __name__ == "__main__":
    main()
