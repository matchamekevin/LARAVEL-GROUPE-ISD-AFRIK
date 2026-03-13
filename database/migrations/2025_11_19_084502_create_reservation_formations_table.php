<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservation_formation', function (Blueprint $table) {
            $table->bigIncrements('id_reservation'); // PostgreSQL ne supporte pas unsigned
            $table->unsignedBigInteger('id_formation');
            $table->unsignedBigInteger('id_utilisateur')->nullable();
            $table->unsignedBigInteger('id_entreprise')->nullable();
            $table->string('type_reservation');       // remplacer enum par string
            $table->integer('nombre_places');
            $table->string('statut')->default('en_attente');
            $table->timestamp('date_reservation');    // PostgreSQL préfère timestamp
            $table->timestamps();

            $table->foreign('id_formation')->references('id_formation')->on('formations')->onDelete('cascade');
            $table->foreign('id_utilisateur')->references('id_utilisateur')->on('utilisateurs')->onDelete('set null');
            $table->foreign('id_entreprise')->references('id_entreprise')->on('entreprises')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_formation');
    }
};