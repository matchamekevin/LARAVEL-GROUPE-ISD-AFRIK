<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('formations', function (Blueprint $table) {
            $table->bigIncrements('id_formation'); // PK
            $table->string('titre', 200);
            $table->text('description')->nullable();
            $table->integer('duree')->nullable(); // en heures ou jours
            $table->decimal('prix', 10, 2)->default(0); // prix avec 2 décimales
            $table->enum('categorie', ['particulier', 'etudiant', 'entreprise'])->nullable(); // cohérent avec ton contrôleur
            $table->date('date_debut')->nullable();
            $table->integer('places_disponibles')->default(0);

            // Clé étrangère vers pays
            $table->unsignedBigInteger('id_pays');

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('id_pays')
                  ->references('id_pays')
                  ->on('pays')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('formations');
    }
};
