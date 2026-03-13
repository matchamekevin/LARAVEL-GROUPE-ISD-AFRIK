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
        // S'assure qu'une catégorie existe (id 1)
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
        // Insère 10 produits pour la catégorie 1
        for ($i = 1; $i <= 10; $i++) {
            $slug = "produit-informatique-$i";
            if (DB::table('produits')->where('slug', $slug)->exists()) {
                continue; // Produit déjà présent, on skip
            }
            DB::table('produits')->insert([
                'uuid' => (string) Str::uuid(),
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
                'id_categorie' => 1,
                'id_pays' => 1,
                'id_utilisateur' => 1,
                'date_creation' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
