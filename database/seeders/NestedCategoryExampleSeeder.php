<?php

namespace Database\Seeders;

use App\Models\CategorieProduit;
use App\Models\Produit;
use App\Models\Pays;
use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class NestedCategoryExampleSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Création de la hiérarchie
        $electronique = CategorieProduit::updateOrCreate(
            ['slug' => 'electronique'],
            [
                'nom' => 'Électronique',
                'description' => 'Produits électroniques divers.',
                'segment' => 'general',
                'actif' => true,
                'ordre' => 10,
            ]
        );

        $informatique = CategorieProduit::updateOrCreate(
            ['slug' => 'informatique'],
            [
                'nom' => 'Informatique',
                'description' => 'Matériel informatique.',
                'segment' => 'general',
                'parent_id' => $electronique->id_categorie,
                'actif' => true,
                'ordre' => 1,
            ]
        );

        $ordinateurs = CategorieProduit::updateOrCreate(
            ['slug' => 'ordinateurs'],
            [
                'nom' => 'Ordinateurs',
                'description' => 'PC fixes et portables.',
                'segment' => 'general',
                'parent_id' => $informatique->id_categorie,
                'actif' => true,
                'ordre' => 1,
            ]
        );

        $portables = CategorieProduit::updateOrCreate(
            ['slug' => 'ordinateurs-portables'],
            [
                'nom' => 'Laptops / Portables',
                'description' => 'Ordinateurs portables de dernière génération.',
                'segment' => 'general',
                'parent_id' => $ordinateurs->id_categorie,
                'actif' => true,
                'ordre' => 1,
            ]
        );

        // 2. Création d'un produit exemple
        $pays = Pays::first() ?? Pays::create(['nom_pays' => 'Sénégal', 'code_iso' => 'SN']);
        $admin = Utilisateur::where('role', 'admin')->first() ?? Utilisateur::first();

        if ($admin) {
            Produit::updateOrCreate(
                ['slug' => 'macbook-pro-m3-exemple'],
                [
                    'titre' => 'MacBook Pro M3 (Exemple Nesting)',
                    'reference' => 'MBP-M3-NEST',
                    'description' => 'Un exemple de produit dans une sous-sous-sous-catégorie.',
                    'prix' => 1500000,
                    'stock' => 5,
                    'statut' => 'disponible',
                    'id_categorie' => $portables->id_categorie,
                    'id_pays' => $pays->id_pays,
                    'id_utilisateur' => $admin->id_utilisateur,
                    'segment' => 'general',
                ]
            );
        }
    }
}
