<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        if (!Schema::hasTable('categories_produits') || !Schema::hasTable('produits')) {
            return;
        }

        DB::unprepared(<<<'SQL'
DROP TRIGGER IF EXISTS trg_validate_geovision_category_hierarchy ON categories_produits;
DROP FUNCTION IF EXISTS validate_geovision_category_hierarchy_fn();

CREATE OR REPLACE FUNCTION validate_geovision_category_hierarchy_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    parent_segment text;
    parent_parent_id bigint;
BEGIN
    IF NEW.segment IS NULL OR lower(NEW.segment) <> 'geovision' THEN
        RETURN NEW;
    END IF;

    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.parent_id = NEW.id_categorie THEN
        RAISE EXCEPTION USING MESSAGE = 'Une categorie GeoVision ne peut pas etre son propre parent.';
    END IF;

    SELECT lower(coalesce(segment, '')), parent_id
      INTO parent_segment, parent_parent_id
    FROM categories_produits
    WHERE id_categorie = NEW.parent_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    IF parent_segment <> 'geovision' THEN
        RAISE EXCEPTION USING MESSAGE = 'Le parent de categorie GeoVision doit appartenir au segment GeoVision.';
    END IF;

    IF parent_parent_id IS NOT NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'GeoVision supporte seulement 2 niveaux: famille puis sous-categorie.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM categories_produits child
        WHERE child.parent_id = NEW.id_categorie
    ) THEN
        RAISE EXCEPTION USING MESSAGE = 'Impossible de definir un parent: cette categorie GeoVision contient deja des sous-categories.';
    END IF;

    IF EXISTS (
        WITH RECURSIVE ancestors AS (
            SELECT id_categorie, parent_id
            FROM categories_produits
            WHERE id_categorie = NEW.parent_id
            UNION ALL
            SELECT c.id_categorie, c.parent_id
            FROM categories_produits c
            JOIN ancestors a ON c.id_categorie = a.parent_id
        )
        SELECT 1
        FROM ancestors
        WHERE id_categorie = NEW.id_categorie
    ) THEN
        RAISE EXCEPTION USING MESSAGE = 'Hierarchie GeoVision invalide: boucle parent detectee.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_geovision_category_hierarchy
BEFORE INSERT OR UPDATE OF segment, parent_id
ON categories_produits
FOR EACH ROW
EXECUTE FUNCTION validate_geovision_category_hierarchy_fn();

DROP TRIGGER IF EXISTS trg_validate_geovision_product_category ON produits;
DROP FUNCTION IF EXISTS validate_geovision_product_category_fn();

CREATE OR REPLACE FUNCTION validate_geovision_product_category_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    category_segment text;
    category_parent_id bigint;
    category_has_children boolean;
BEGIN
    SELECT lower(coalesce(c.segment, '')),
           c.parent_id,
           EXISTS (
               SELECT 1
               FROM categories_produits child
               WHERE child.parent_id = c.id_categorie
           )
      INTO category_segment, category_parent_id, category_has_children
    FROM categories_produits c
    WHERE c.id_categorie = NEW.id_categorie;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    IF category_segment <> 'geovision' THEN
        RETURN NEW;
    END IF;

    IF category_parent_id IS NULL OR category_has_children THEN
        RAISE EXCEPTION USING MESSAGE = 'Un modele GeoVision doit etre rattache a une sous-categorie finale.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_geovision_product_category
BEFORE INSERT OR UPDATE OF id_categorie
ON produits
FOR EACH ROW
EXECUTE FUNCTION validate_geovision_product_category_fn();
SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::unprepared(<<<'SQL'
DROP TRIGGER IF EXISTS trg_validate_geovision_product_category ON produits;
DROP FUNCTION IF EXISTS validate_geovision_product_category_fn();

DROP TRIGGER IF EXISTS trg_validate_geovision_category_hierarchy ON categories_produits;
DROP FUNCTION IF EXISTS validate_geovision_category_hierarchy_fn();
SQL);
    }
};
