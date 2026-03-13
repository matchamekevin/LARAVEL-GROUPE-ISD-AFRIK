<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('livraisons', function (Blueprint $table) {
            $table->bigIncrements('id_livraison'); // PostgreSQL ne supporte pas "unsigned"
            $table->string('adresse', 255);
            $table->string('ville', 100);
            $table->string('pays', 100);
            $table->string('statut', 20)->default('en_attente');
            $table->date('date_livraison_prev')->nullable();

            $table->unsignedBigInteger('id_commande')->unique(); // FK explicite pour PostgreSQL

            $table->timestamps();

            $table->foreign('id_commande')
                  ->references('id_commande')
                  ->on('commandes')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('livraisons');
    }
};