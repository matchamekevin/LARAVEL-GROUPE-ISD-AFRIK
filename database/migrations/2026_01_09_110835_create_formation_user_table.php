<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFormationUserTable extends Migration
{
    public function up()
    {
        Schema::create('formation_user', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_formation');
            $table->unsignedBigInteger('id_utilisateur'); 
            
            // Champs supplémentaires envoyés par ton formulaire React
            $table->string('responsable_nom')->nullable();
            $table->string('responsable_prenom')->nullable();
            $table->string('civilite')->nullable();
            $table->string('fonction')->nullable();
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->string('mobile')->nullable();
            $table->string('societe')->nullable();
            $table->string('adresse_societe')->nullable();
            $table->string('facturation')->default('participant'); // participant ou société

            $table->timestamps();

            // Clés étrangères
            $table->foreign('id_formation')
                  ->references('id_formation')
                  ->on('formations')
                  ->onDelete('cascade');

            $table->foreign('id_utilisateur')
                  ->references('id_utilisateur')
                  ->on('utilisateurs')
                  ->onDelete('cascade');

            // Empêcher les doublons
            $table->unique(['id_formation', 'id_utilisateur']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('formation_user');
    }
}