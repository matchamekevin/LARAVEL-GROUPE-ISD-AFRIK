<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ligne_commandes', function (Blueprint $table) {
            $table->bigIncrements('id_ligne'); // PK
            $table->integer('quantite')->default(1);
            $table->decimal('prix_unitaire', 10, 2);
            $table->decimal('sous_total', 10, 2);

            // FK vers commande
            $table->unsignedBigInteger('id_commande');
            $table->foreign('id_commande')
                  ->references('id_commande')
                  ->on('commandes')
                  ->onDelete('cascade');

            // FK vers produit
            $table->unsignedBigInteger('id_produit');
            $table->foreign('id_produit')
                  ->references('id_produit')
                  ->on('produits')
                  ->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ligne_commandes');
    }
};
