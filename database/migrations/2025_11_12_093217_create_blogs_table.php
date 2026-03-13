<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blogs', function (Blueprint $table) {
            $table->bigIncrements('id_blog'); // PostgreSQL ne supporte pas "unsigned"
            $table->string('titre', 200);
            $table->text('contenu');
            $table->timestamp('date_pub')->useCurrent(); // PostgreSQL préfère timestamp

            $table->unsignedBigInteger('id_utilisateur'); // FK explicite pour PostgreSQL

            $table->foreign('id_utilisateur')
                  ->references('id_utilisateur')
                  ->on('utilisateurs')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blogs');
    }
};