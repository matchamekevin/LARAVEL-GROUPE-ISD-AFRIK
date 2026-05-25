<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProduitDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // S'assure qu'une catégorie existe
        $catId = DB::table('categories_produits')->value('id_categorie');
        if (!$catId) {
            $catId = (string) Str::uuid();
            DB::table('categories_produits')->insert([
                'id_categorie' => $catId,
                'nom' => 'Informatique',
                'slug' => 'informatique',
                'description' => 'Matériel informatique',
                'actif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        // Insère 10 produits pour la catégorie 1
        for ($i = 1; $i <= 10; $i++) {
            $slug = "produit-informatique-$i";
            if (DB::table('produits')->where('slug', $slug)->exists()) {
                continue; // Produit déjà présent, on skip
            }
            DB::table('produits')->insert([
                'id_produit' => (string) Str::uuid(),
                'titre' => "Produit Informatique $i",
                'slug' => $slug,
                'reference' => strtoupper(Str::random(8)),
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
                'id_categorie' => $catId,
                'id_pays' => DB::table('pays')->value('id_pays'),
                'id_utilisateur' => DB::table('utilisateurs')->value('id_utilisateur'),
                'date_creation' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
