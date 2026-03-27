<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            UtilisateurSeeder::class,
            TestWorkflowSeeder::class,
            ProduitCoreOfferingsSeeder::class, // Catalogue recentré sur 3 offres coeur
            FormationSeeder::class, // Ajout du seeder formations
            ProduitDemoSeeder::class, // Ajout des produits de démonstration
            CategorieProduitSeeder::class, // Ajout des catégories produits
            IngenierieTypeModeleSeeder::class, // Produits de demonstration par type/modele en Ingenierie
            GeovisionCatalogSeeder::class, // Arborescence GeoVision DB-driven
            ProduitMinimumPerCategorySeeder::class, // Complète chaque catégorie à 5 produits minimum
        ]);
    }
}
