<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('categories_produits')) {
            return;
        }

        Schema::table('categories_produits', function (Blueprint $table) {
            // Nouveau champ: contrôle le comportement d'affichage côté front/admin
            $table->enum('display_mode', ['auto', 'children', 'products'])->default('auto')->after('ordre');
            $table->index('display_mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('categories_produits')) {
            return;
        }

        Schema::table('categories_produits', function (Blueprint $table) {
            if (Schema::hasColumn('categories_produits', 'display_mode')) {
                $table->dropIndex(['display_mode']);
                $table->dropColumn('display_mode');
            }
        });
    }
};
