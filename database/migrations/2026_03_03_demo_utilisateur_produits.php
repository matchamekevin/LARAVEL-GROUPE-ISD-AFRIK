<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Pays par défaut
        if (!DB::table('pays')->where('id_pays', 1)->exists()) {
            DB::table('pays')->insert([
                'id_pays' => 1,
                'nom_pays' => 'Togo',
                'code_pays' => '+228',
                'devise_locale' => 'Franc CFA',
                'langue_principale' => 'Français',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        // Catégorie par défaut
        if (!DB::table('categories_produits')->where('id_categorie', 1)->exists()) {
            DB::table('categories_produits')->insert([
                'id_categorie' => 1,
                'nom' => 'Informatique',
                'slug' => 'informatique',
                'description' => 'Matériel informatique',
                'actif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        // Utilisateur admin par défaut
        if (!DB::table('utilisateurs')->where('id_utilisateur', 1)->exists()) {
            DB::table('utilisateurs')->insert([
                'id_utilisateur' => 1,
                'nom' => 'Admin',
                'prenom' => 'Test',
                'email' => 'admin@test.com',
                'telephone' => '90000001',
                'mot_de_passe' => Hash::make('admin123'),
                'role' => 'admin',
                'is_admin' => true,
                'statut' => 'actif',
                'date_creation' => now(),
                'id_pays' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        // 10 produits de démo
        for ($i = 1; $i <= 10; $i++) {
            DB::table('produits')->insert([
                'titre' => "Produit Informatique $i",
                'slug' => "produit-informatique-$i",
                'reference' => strtoupper(uniqid('REF')),
                'description' => "Description longue du produit informatique $i",
                'description_courte' => "Produit $i - Informatique",
                'prix' => rand(100, 5000),
                'prix_promo' => rand(80, 4900),
                'stock' => rand(5, 100),
                'stock_alerte' => 5,
                'statut' => 'disponible',
                'marque' => 'HP',
                'modele' => "Modèle $i",
                'poids' => rand(1, 10),
                'specifications' => json_encode(['couleur' => 'noir', 'puissance' => rand(10, 100) . 'W']),
                'garantie' => '1 an',
                'est_en_vedette' => (bool)rand(0, 1),
                'est_nouveau' => (bool)rand(0, 1),
                'vues' => rand(0, 1000),
                'note_moyenne' => rand(30, 50) / 10,
                'nombre_avis' => rand(0, 100),
                'id_categorie' => 1,
                'id_pays' => 1,
                'id_utilisateur' => 1,
                'date_creation' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('produits')->where('id_categorie', 1)->delete();
        DB::table('utilisateurs')->where('id_utilisateur', 1)->delete();
        DB::table('categories_produits')->where('id_categorie', 1)->delete();
        DB::table('pays')->where('id_pays', 1)->delete();
    }
};
