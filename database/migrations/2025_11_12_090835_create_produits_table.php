<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration pour créer la table 'produits' - VERSION COMPLÈTE
 * Inclut : stock, catégorie, marque, prix_promo, images, etc.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ============================================================
        // TABLE CATÉGORIES (doit exister AVANT produits)
        // ============================================================
        Schema::create('categories_produits', function (Blueprint $table) {
            $table->bigIncrements('id_categorie');
            $table->string('nom', 100);
            $table->string('slug', 120)->unique();
            $table->text('description')->nullable();
            $table->string('icone', 100)->nullable();           // ex: "laptop", "printer", "drone"
            $table->string('image', 255)->nullable();           // image de la catégorie
            $table->unsignedBigInteger('parent_id')->nullable(); // pour sous-catégories
            $table->integer('ordre')->default(0);               // ordre d'affichage
            $table->boolean('actif')->default(true);
            $table->timestamps();

            $table->foreign('parent_id')
                  ->references('id_categorie')
                  ->on('categories_produits')
                  ->onDelete('set null');
        });

        // ============================================================
        // TABLE PRODUITS - COMPLÈTE
        // ============================================================
        Schema::create('produits', function (Blueprint $table) {
            $table->bigIncrements('id_produit');

            // ── Informations de base ──────────────────────────────
            $table->string('titre', 200);                          // Nom du produit
            $table->string('slug', 220)->unique()->nullable();     // URL: /produits/laptop-hp-250
            $table->string('reference', 100)->nullable()->unique(); // SKU/Référence
            $table->text('description')->nullable();               // Description longue
            $table->text('description_courte')->nullable();        // Description courte (carte produit)

            // ── Prix ──────────────────────────────────────────────
            $table->decimal('prix', 10, 2);                        // Prix normal
            $table->decimal('prix_promo', 10, 2)->nullable();      // Prix promotionnel
            $table->timestamp('promo_debut')->nullable();          // Début de la promo
            $table->timestamp('promo_fin')->nullable();            // Fin de la promo

            // ── Stock & disponibilité ─────────────────────────────
            $table->integer('stock')->default(0);                  // Quantité en stock
            $table->integer('stock_alerte')->default(5);           // Alerte si stock < X
            $table->string('statut', 30)->default('disponible');   // disponible|rupture|archive|brouillon

            // ── Caractéristiques produit ──────────────────────────
            $table->string('marque', 100)->nullable();             // HP, Dell, DJI, Canon...
            $table->string('modele', 100)->nullable();             // Modèle exact
            $table->decimal('poids', 8, 2)->nullable();            // En kg
            $table->json('specifications')->nullable();            // Specs techniques en JSON
            $table->string('garantie', 50)->nullable();            // "1 an", "2 ans"...

            // ── Mise en avant ──────────────────────────────────────
            $table->boolean('est_en_vedette')->default(false);     // Affiché sur la home
            $table->boolean('est_nouveau')->default(false);        // Badge "Nouveau"
            $table->integer('vues')->default(0);                   // Compteur de vues
            $table->decimal('note_moyenne', 3, 2)->default(0);     // Note moyenne /5
            $table->integer('nombre_avis')->default(0);            // Nombre total d'avis

            // ── Relations ─────────────────────────────────────────
            $table->unsignedBigInteger('id_categorie');            // Catégorie du produit
            $table->unsignedBigInteger('id_pays');                 // Pays de vente
            $table->unsignedBigInteger('id_utilisateur')->nullable(); // Admin qui a créé

            // ── Dates ─────────────────────────────────────────────
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamps();
            $table->softDeletes();

            // ── Index pour performances ───────────────────────────
            $table->index('statut');
            $table->index('est_en_vedette');
            $table->index('est_nouveau');
            $table->index('marque');
            $table->index(['id_categorie', 'statut']);
            $table->index(['id_pays', 'statut']);

            // ── Clés étrangères ───────────────────────────────────
            $table->foreign('id_categorie')
                  ->references('id_categorie')
                  ->on('categories_produits')
                  ->onDelete('restrict');

            $table->foreign('id_pays')
                  ->references('id_pays')
                  ->on('pays')
                  ->onDelete('cascade');

            $table->foreign('id_utilisateur')
                  ->references('id_utilisateur')
                  ->on('utilisateurs')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produits');
        Schema::dropIfExists('categories_produits');
    }
};