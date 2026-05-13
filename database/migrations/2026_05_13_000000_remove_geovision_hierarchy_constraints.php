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

        // Remove the restrictive triggers that limit GeoVision hierarchy to 2 levels
        DB::unprepared(<<<'SQL'
DROP TRIGGER IF EXISTS trg_validate_geovision_category_hierarchy ON categories_produits;
DROP FUNCTION IF EXISTS validate_geovision_category_hierarchy_fn();

DROP TRIGGER IF EXISTS trg_validate_geovision_product_category ON produits;
DROP FUNCTION IF EXISTS validate_geovision_product_category_fn();
SQL);
    }

    public function down(): void
    {
        // Re-apply if needed, but for now we want to support infinite nesting
    }
};
