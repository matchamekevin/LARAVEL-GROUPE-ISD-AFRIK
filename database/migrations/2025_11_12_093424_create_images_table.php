<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('images', function (Blueprint $table) {
            $table->bigIncrements('id_image'); // Clé primaire
            $table->string('url', 255);        // URL complète de l'image
            $table->string('path', 255);       // Chemin local ou relatif
            $table->string('alt', 150)->nullable(); // Texte alternatif (SEO / accessibilité)
            $table->string('imageable_type', 50);   // Type du modèle lié
            $table->bigInteger('imageable_id');     // ID du modèle lié
            $table->timestamps();
        });

        // Contrainte CHECK PostgreSQL-compatible
        DB::statement("
            ALTER TABLE images 
            ADD CONSTRAINT imageable_type_check 
            CHECK (imageable_type IN ('PRODUIT','FORMATION','BLOG'))
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('images');
    }
};