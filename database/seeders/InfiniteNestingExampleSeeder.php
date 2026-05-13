<?php

namespace Database\Seeders;

use App\Models\CategorieProduit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InfiniteNestingExampleSeeder extends Seeder
{
    public function run(): void
    {
        $root = CategorieProduit::updateOrCreate(
            ['slug' => 'catalogue-infini'],
            [
                'nom' => 'Catalogue Infini',
                'description' => 'Exemple de catégorie à nidification profonde.',
                'segment' => 'general',
                'actif' => true,
            ]
        );

        $lvl1 = CategorieProduit::updateOrCreate(
            ['slug' => 'niveau-1'],
            [
                'nom' => 'Niveau 1',
                'parent_id' => $root->id_categorie,
                'segment' => 'general',
            ]
        );

        $lvl2 = CategorieProduit::updateOrCreate(
            ['slug' => 'niveau-2'],
            [
                'nom' => 'Niveau 2',
                'parent_id' => $lvl1->id_categorie,
                'segment' => 'general',
            ]
        );

        $lvl3 = CategorieProduit::updateOrCreate(
            ['slug' => 'niveau-3'],
            [
                'nom' => 'Niveau 3',
                'parent_id' => $lvl2->id_categorie,
                'segment' => 'general',
            ]
        );

        CategorieProduit::updateOrCreate(
            ['slug' => 'niveau-4'],
            [
                'nom' => 'Niveau 4 (Final)',
                'parent_id' => $lvl3->id_categorie,
                'segment' => 'general',
            ]
        );
    }
}
