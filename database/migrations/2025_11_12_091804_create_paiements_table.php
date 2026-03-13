<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            // Clé primaire
            $table->bigIncrements('id_paiement');

            // Informations de transaction
            $table->string('reference_transaction', 100)->unique(); // Référence unique (CinetPay ou générée)
            $table->string('moyen_paiement', 50); // Mobile Money, Carte, etc.
            $table->string('statut_paiement', 20)->default('en_attente'); // en_attente, réussi, échoué
            $table->decimal('montant', 10, 2);
            $table->timestamp('date_paiement')->useCurrent();

            // ✅ FK vers commande (produit)
            $table->unsignedBigInteger('id_commande')->nullable();
            $table->foreign('id_commande')
                  ->references('id_commande')
                  ->on('commandes')
                  ->onDelete('cascade');

            // ✅ FK vers formation
            $table->unsignedBigInteger('id_formation')->nullable();
            $table->foreign('id_formation')
                  ->references('id_formation')
                  ->on('formations')
                  ->onDelete('cascade');

            // ✅ FK vers utilisateur
            $table->unsignedBigInteger('id_utilisateur');
            $table->foreign('id_utilisateur')
                  ->references('id_utilisateur')
                  ->on('utilisateurs')
                  ->onDelete('cascade');

            // Timestamps Laravel
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};