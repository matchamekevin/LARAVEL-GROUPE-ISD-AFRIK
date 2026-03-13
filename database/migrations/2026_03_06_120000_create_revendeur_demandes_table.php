<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('revendeur_demandes', function (Blueprint $table) {
            $table->id();
            $table->string('nom_entreprise');
            $table->string('statut_juridique')->nullable();
            $table->string('rccm')->nullable();
            $table->string('identifiant_fiscal')->nullable();
            $table->string('annee_creation')->nullable();
            $table->string('adresse_siege')->nullable();
            $table->string('pays');
            $table->string('ville')->nullable();
            $table->string('telephone');
            $table->string('email_professionnel');
            $table->string('site_web')->nullable();

            $table->string('representant_nom');
            $table->string('representant_fonction')->nullable();
            $table->string('representant_telephone')->nullable();
            $table->string('representant_email')->nullable();

            $table->text('zone_couverture')->nullable();
            $table->string('experience_annees')->nullable();
            $table->text('marques_distribuees')->nullable();
            $table->text('motivation');

            $table->boolean('equipe_commerciale')->default(false);
            $table->boolean('equipe_technique')->default(false);
            $table->boolean('showroom')->default(false);
            $table->boolean('service_installation_maintenance')->default(false);

            $table->json('activites')->nullable();
            $table->json('documents')->nullable();

            $table->string('statut')->default('en_attente');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revendeur_demandes');
    }
};
