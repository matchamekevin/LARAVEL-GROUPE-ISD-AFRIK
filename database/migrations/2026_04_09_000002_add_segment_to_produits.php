<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('produits', function (Blueprint $table) {
            $table->string('segment')->nullable()->after('id_categorie');
        });

        // Backfill segment from categories_produits
        DB::statement('UPDATE produits SET segment = cp.segment FROM categories_produits cp WHERE produits.id_categorie = cp.id_categorie');

        Schema::table('produits', function (Blueprint $table) {
            $table->index('segment', 'produits_segment_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('produits', function (Blueprint $table) {
            $table->dropIndex('produits_segment_index');
            $table->dropColumn('segment');
        });
    }
};
