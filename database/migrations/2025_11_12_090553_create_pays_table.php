<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crée la table 'pays' pour référencer les pays disponibles sur la plateforme.
     */
    public function up(): void
    {
        Schema::create('pays', function (Blueprint $table) {
            $table->bigIncrements('id_pays'); // Clé primaire auto-incrémentée

            $table->string('nom_pays', 150); // Nom du pays (ex: Togo)
            $table->string('code_pays', 10)->unique(); // Indicatif téléphonique (ex: +228)
            $table->string('devise_locale', 50)->nullable(); // Devise locale (ex: Franc CFA)
            $table->string('langue_principale', 50)->nullable(); // Langue principale (ex: Français)

            $table->timestamps(); // Champs created_at et updated_at
            $table->softDeletes(); // Ajoute la colonne deleted_at pour SoftDeletes
        });
    }

    /**
     * Supprime la table 'pays' si elle existe.
     */
    public function down(): void
    {
        Schema::dropIfExists('pays');
    }
};