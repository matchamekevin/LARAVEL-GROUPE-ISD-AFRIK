<?php

use App\Models\CategorieProduit;
use App\Models\Produit;

it('returns children when category has children and display_mode is auto', function () {
    $parent = CategorieProduit::query()->create([
        'nom' => 'Parent A',
        'slug' => 'parent-a',
        'segment' => 'general',
        'actif' => true,
    ]);

    $child = CategorieProduit::query()->create([
        'nom' => 'Child A1',
        'slug' => 'child-a1',
        'parent_id' => $parent->id_categorie,
        'segment' => 'general',
        'actif' => true,
    ]);

    $this->getJson('/api/categories-produits/' . $parent->id_categorie)
        ->assertOk()
        ->assertJson(fn (AssertableJson $json) =>
            $json->has('children')
                 ->where('children.0.id_categorie', $child->id_categorie)
                 ->etc()
        );
});

it('returns products when display_mode is products even if children exist', function () {
    $parent = CategorieProduit::query()->create([
        'nom' => 'Parent B',
        'slug' => 'parent-b',
        'segment' => 'general',
        'actif' => true,
        'display_mode' => 'products',
    ]);

    $child = CategorieProduit::query()->create([
        'nom' => 'Child B1',
        'slug' => 'child-b1',
        'parent_id' => $parent->id_categorie,
        'segment' => 'general',
        'actif' => true,
    ]);

    $product = Produit::query()->create([
        'titre' => 'P B1',
        'slug' => 'p-b1',
        'prix' => 1000,
        'statut' => 'disponible',
        'id_categorie' => $parent->id_categorie,
        'id_pays' => 1,
        'date_creation' => now(),
    ]);

    $this->getJson('/api/categories-produits/' . $parent->id_categorie)
        ->assertOk()
        ->assertJson(fn (AssertableJson $json) =>
            $json->has('produits')
                 ->where('produits.0.id_produit', $product->id_produit)
                 ->etc()
        );
});
