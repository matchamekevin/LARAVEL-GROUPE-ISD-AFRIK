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
        DB::table('pays')->updateOrInsert(
            ['code_pays' => '+228'],
            [
                'nom_pays' => 'Togo',
                'devise_locale' => 'Franc CFA',
                'langue_principale' => 'Français',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $idPays = DB::table('pays')->where('code_pays', '+228')->value('id_pays');

        // Catégorie par défaut
        DB::table('categories_produits')->updateOrInsert(
            ['slug' => 'informatique'],
            [
                'nom' => 'Informatique',
                'description' => 'Matériel informatique',
                'actif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $idCategorie = DB::table('categories_produits')->where('slug', 'informatique')->value('id_categorie');

        // Utilisateur admin par défaut
        DB::table('utilisateurs')->updateOrInsert(
            ['email' => 'admin@test.com'],
            [
                'nom' => 'Admin',
                'prenom' => 'Test',
                'telephone' => '90000001',
                'mot_de_passe' => Hash::make('admin123'),
                'role' => 'admin_adjoint',
                'admin_role' => 'admin_adjoint',
                'is_admin' => true,
                'statut' => 'actif',
                'date_creation' => now(),
                'id_pays' => $idPays,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $idUtilisateur = DB::table('utilisateurs')->where('email', 'admin@test.com')->value('id_utilisateur');
        // 10 produits de démo
        for ($i = 1; $i <= 10; $i++) {
            DB::table('produits')->updateOrInsert([
                'slug' => "produit-informatique-$i",
            ], [
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
                'id_categorie' => $idCategorie,
                'id_pays' => $idPays,
                'id_utilisateur' => $idUtilisateur,
                'date_creation' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('pays','id_pays'), COALESCE((SELECT MAX(id_pays) FROM pays), 1), true)");
            DB::statement("SELECT setval(pg_get_serial_sequence('categories_produits','id_categorie'), COALESCE((SELECT MAX(id_categorie) FROM categories_produits), 1), true)");
            DB::statement("SELECT setval(pg_get_serial_sequence('utilisateurs','id_utilisateur'), COALESCE((SELECT MAX(id_utilisateur) FROM utilisateurs), 1), true)");
            DB::statement("SELECT setval(pg_get_serial_sequence('produits','id_produit'), COALESCE((SELECT MAX(id_produit) FROM produits), 1), true)");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('produits')->where('slug', 'like', 'produit-informatique-%')->delete();
        DB::table('utilisateurs')->where('email', 'admin@test.com')->delete();
        DB::table('categories_produits')->where('slug', 'informatique')->delete();
        DB::table('pays')->where('code_pays', '+228')->delete();
    }
};
