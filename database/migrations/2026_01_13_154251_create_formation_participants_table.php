<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('formation_participants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_formation');
            $table->unsignedBigInteger('id_utilisateur');
    
            $table->string('nom');
            $table->string('prenom');
            $table->string('fonction')->nullable();
            $table->string('contact')->nullable();
            $table->decimal('prix', 10, 2)->nullable();
    
            $table->timestamps();
    
            $table->foreign('id_formation')->references('id_formation')->on('formations')->onDelete('cascade');
            $table->foreign('id_utilisateur')->references('id_utilisateur')->on('utilisateurs')->onDelete('cascade');
        });
    }
    

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('formation_participants');
    }
};
