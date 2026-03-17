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
        // Supprimer l'ancienne contrainte
        DB::statement("ALTER TABLE images DROP CONSTRAINT imageable_type_check");

        // Ajouter la nouvelle contrainte avec CATEGORY
        DB::statement("
            ALTER TABLE images
            ADD CONSTRAINT imageable_type_check
            CHECK (imageable_type IN ('PRODUIT','FORMATION','BLOG','CATEGORY'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Supprimer la nouvelle contrainte
        DB::statement("ALTER TABLE images DROP CONSTRAINT imageable_type_check");

        // Remettre l'ancienne contrainte
        DB::statement("
            ALTER TABLE images
            ADD CONSTRAINT imageable_type_check
            CHECK (imageable_type IN ('PRODUIT','FORMATION','BLOG'))
        ");
    }
};
