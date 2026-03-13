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
        Schema::table('pays', function (Blueprint $table) {
            // Ajoute la colonne deleted_at pour SoftDeletes
            if (!Schema::hasColumn('pays', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pays', function (Blueprint $table) {
            // Supprime la colonne deleted_at si elle existe
            if (Schema::hasColumn('pays', 'deleted_at')) {
                $table->dropColumn('deleted_at');
            }
        });
    }
};