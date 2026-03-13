<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commandes', function (Blueprint $table) {
            $table->bigIncrements('id_commande'); // PK
            $table->string('numero_commande', 50)->unique();
            $table->timestamp('date_commande')->useCurrent();
            $table->string('statut', 20)->default('en_attente'); // en_attente, payée, annulée
            $table->string('type_commande', 20)->default('produit'); // produit, formation, mixte
            $table->decimal('montant_total', 10, 2);
            $table->decimal('montant_commission', 10, 2)->nullable();
            $table->timestamp('date_livraison')->nullable();

            // FK utilisateur
            $table->unsignedBigInteger('id_utilisateur');

            $table->timestamps();

            $table->foreign('id_utilisateur')
                  ->references('id_utilisateur') // ⚡ si ta table est "utilisateurs"
                  ->on('utilisateurs')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commandes');
    }
};
