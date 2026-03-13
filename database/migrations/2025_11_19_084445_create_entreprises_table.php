<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entreprises', function (Blueprint $table) {
            $table->bigIncrements('id_entreprise'); // PostgreSQL ne supporte pas "unsigned"
            $table->string('nom');
            $table->string('email')->unique();
            $table->string('telephone')->nullable();
            $table->string('mot_de_passe');
            $table->string('secteur')->nullable();
            $table->string('pays')->nullable();
            $table->text('adresse')->nullable();
            $table->integer('nombre_participants')->default(0);
            $table->string('statut')->default('actif');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entreprises');
    }
};