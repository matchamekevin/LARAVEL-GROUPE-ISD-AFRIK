<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('devis_prestations', function (Blueprint $table) {
            $table->id();
            $table->string('prestation_slug')->index();
            $table->string('prestation_name');
            $table->json('services')->nullable();
            $table->json('technologies')->nullable();
            $table->string('statut')->default('nouveau')->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devis_prestations');
    }
};
