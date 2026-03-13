<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->bigIncrements('id_utilisateur'); // clé primaire
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 150)->unique();
            $table->string('telephone', 20)->nullable();
            $table->string('mot_de_passe');
            $table->string('role', 50)->default('client');
            $table->boolean('is_admin')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->string('statut', 20)->default('actif');
            $table->string('two_factor_code')->nullable();
            $table->timestamp('two_factor_expires_at')->nullable();

            // ✅ clé étrangère vers la table pays
            $table->unsignedBigInteger('id_pays');
            $table->foreign('id_pays')
                  ->references('id_pays')
                  ->on('pays')
                  ->onDelete('cascade');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};