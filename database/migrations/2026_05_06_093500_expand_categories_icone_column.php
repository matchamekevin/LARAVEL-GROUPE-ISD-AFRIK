<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('categories_produits') || !Schema::hasColumn('categories_produits', 'icone')) {
            return;
        }

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE categories_produits ALTER COLUMN icone TYPE TEXT');
            return;
        }

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE categories_produits MODIFY icone TEXT NULL');
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('categories_produits') || !Schema::hasColumn('categories_produits', 'icone')) {
            return;
        }

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE categories_produits ALTER COLUMN icone TYPE VARCHAR(100) USING LEFT(icone, 100)');
            return;
        }

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE categories_produits MODIFY icone VARCHAR(100) NULL');
        }
    }
};

