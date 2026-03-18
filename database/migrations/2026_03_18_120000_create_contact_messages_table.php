<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nom_complet', 255);
            $table->string('email', 255);
            $table->string('telephone', 30)->nullable();
            $table->string('sujet', 255)->nullable();
            $table->text('message');
            $table->string('statut', 30)->default('nouveau');
            $table->timestamps();

            $table->index('email');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
