<?php

use App\Models\CategorieProduit;
use App\Models\Pays;
use App\Models\Produit;
use App\Models\Utilisateur;
use Database\Seeders\GeovisionCatalogSeeder;

beforeEach(function () {
    $country = Pays::query()->create([
        'nom_pays' => 'Togo',
        'code_pays' => 'TG',
        'devise_locale' => 'XOF',
        'langue_principale' => 'fr',
    ]);

    Utilisateur::query()->create([
        'nom' => 'Admin',
        'prenom' => 'GeoVision',
        'email' => 'admin-geovision@example.test',
        'mot_de_passe' => 'password',
        'admin_role' => 'admin_adjoint',
        'is_admin' => true,
        'statut' => 'actif',
        'can_access_client' => true,
        'can_access_admin' => true,
        'id_pays' => $country->id_pays,
    ]);

    $this->seed(GeovisionCatalogSeeder::class);
});

it('returns the geovision category tree', function () {
    $response = $this->getJson('/api/categories-produits?segment=geovision&tree=1');

    $response
        ->assertOk()
        ->assertJsonFragment(['slug' => 'geovision-cameras'])
        ->assertJsonFragment(['slug' => 'geovision-camera-ip'])
        ->assertJsonFragment(['slug' => 'geovision-enregistreurs-nvr']);
});

it('lists geovision products from a category slug including descendants', function () {
    $response = $this->getJson('/api/produits?segment=geovision&category_slug=geovision-camera-ip&include_descendants=1&par_page=50');

    $response
        ->assertOk()
        ->assertJsonFragment(['slug' => 'geovision-gv-gvd4910'])
        ->assertJsonFragment(['slug' => 'geovision-gv-gfer12800'])
        ->assertJsonMissing(['slug' => 'geovision-gv-nvr']);
});

it('returns a geovision product by slug with structured specifications', function () {
    $response = $this->getJson('/api/produits/slug/geovision-gv-gvd4910');

    $response
        ->assertOk()
        ->assertJsonPath('data.slug', 'geovision-gv-gvd4910')
        ->assertJsonPath('data.specifications.taxonomy.family', 'Caméras')
        ->assertJsonPath('data.specifications.taxonomy.category', 'Caméra IP')
        ->assertJsonPath('data.specifications.taxonomy.subcategory', 'Dôme');
});

it('keeps the geovision segment filter isolated from the general catalog', function () {
    $generalCategory = CategorieProduit::query()->create([
        'nom' => 'Informatique',
        'slug' => 'informatique',
        'segment' => 'general',
        'description' => 'Catégorie générale de test',
        'actif' => true,
    ]);

    Produit::query()->create([
        'titre' => 'Laptop Pro 14',
        'slug' => 'laptop-pro-14',
        'reference' => 'LAPTOP-PRO-14',
        'description' => 'Produit général hors GeoVision',
        'prix' => 450000,
        'stock' => 5,
        'statut' => 'disponible',
        'id_categorie' => $generalCategory->id_categorie,
        'id_pays' => Pays::query()->value('id_pays'),
        'id_utilisateur' => Utilisateur::query()->value('id_utilisateur'),
        'date_creation' => now(),
    ]);

    $this->getJson('/api/produits?segment=geovision&par_page=100')
        ->assertOk()
        ->assertJsonMissing(['slug' => 'laptop-pro-14']);

    $this->getJson('/api/produits?par_page=100')
        ->assertOk()
        ->assertJsonFragment(['slug' => 'laptop-pro-14']);
});
