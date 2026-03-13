<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets_support', function (Blueprint $table) {
            $table->bigIncrements('id_ticket'); // PostgreSQL ne supporte pas "unsigned"
            $table->string('sujet', 200);
            $table->text('message');
            $table->string('statut', 20)->default('ouvert');
            $table->timestamp('date_creation')->useCurrent(); // PostgreSQL préfère timestamp

            $table->unsignedBigInteger('id_utilisateur'); // FK explicite pour PostgreSQL

            $table->foreign('id_utilisateur')
                  ->references('id_utilisateur')
                  ->on('utilisateurs')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets_support');
    }
};