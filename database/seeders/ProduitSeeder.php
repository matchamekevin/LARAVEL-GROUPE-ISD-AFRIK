<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Produit;
use App\Models\CategorieProduit;
use Illuminate\Support\Str;

class ProduitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer toutes les catégories
        $categories = CategorieProduit::all();
        $marques = ['HP', 'Dell', 'DJI', 'Canon', 'Apple', 'Lenovo', 'Samsung', 'Epson', 'Brother', 'Asus'];
        foreach ($categories as $categorie) {
            for ($i = 1; $i <= 10; $i++) {
                $marque = $marques[array_rand($marques)];
                Produit::create([
                    'uuid' => (string) Str::uuid(),
                    'titre' => $categorie->nom . " Produit $i",
                    'slug' => Str::slug($categorie->nom . " Produit $i"),
                    'reference' => strtoupper(Str::random(8)),
                    'description' => "Description longue du produit $i de la catégorie " . $categorie->nom,
                    'description_courte' => "Produit $i - " . $categorie->nom,
                    'prix' => rand(100, 5000),
                    'prix_promo' => rand(80, 4900),
                    'stock' => rand(5, 100),
                    'stock_alerte' => 5,
                    'statut' => 'disponible',
                    'marque' => $marque,
                    'modele' => "Modèle $i",
                    'poids' => rand(1, 10),
                    'specifications' => json_encode(['couleur' => 'noir', 'puissance' => rand(10, 100) . 'W']),
                    'garantie' => '1 an',
                    'est_en_vedette' => (bool)rand(0, 1),
                    'est_nouveau' => (bool)rand(0, 1),
                    'vues' => rand(0, 1000),
                    'note_moyenne' => rand(30, 50) / 10,
                    'nombre_avis' => rand(0, 100),
                    'id_categorie' => $categorie->id_categorie,
                    'id_pays' => 1, // à adapter selon tes pays
                    'id_utilisateur' => 1, // à adapter selon tes utilisateurs
                    'date_creation' => now(),
                ]);
            }
        }
    }
}
