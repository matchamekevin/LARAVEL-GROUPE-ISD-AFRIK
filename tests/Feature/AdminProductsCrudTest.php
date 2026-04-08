<?php

use App\Models\CategorieProduit;
use App\Models\Pays;
use App\Models\Produit;
use App\Models\Utilisateur;
use Laravel\Sanctum\Sanctum;

function makeAdminProductsContext(): array
{
    $country = Pays::query()->create([
        'nom_pays' => 'Togo',
        'code_pays' => 'TG',
        'devise_locale' => 'XOF',
        'langue_principale' => 'fr',
    ]);

    $category = CategorieProduit::query()->create([
        'nom' => 'Admin test category',
        'slug' => 'admin-test-category',
        'description' => 'Category for admin products CRUD tests',
        'segment' => 'general',
        'actif' => true,
    ]);

    $admin = Utilisateur::query()->create([
        'nom' => 'Admin',
        'prenom' => 'Products',
        'email' => 'admin-products-' . now()->timestamp . '-' . random_int(1000, 9999) . '@example.test',
        'mot_de_passe' => 'password',
        'role' => 'admin_adjoint',
        'admin_role' => 'admin_adjoint',
        'is_admin' => true,
        'statut' => 'actif',
        'can_access_client' => true,
        'can_access_admin' => true,
        'id_pays' => $country->id_pays,
    ]);

    return [
        'admin' => $admin,
        'country_id' => $country->id_pays,
        'category_id' => $category->id_categorie,
    ];
}

it('creates a product through admin api and persists it in database', function () {
    $context = makeAdminProductsContext();
    Sanctum::actingAs($context['admin'], ['*']);

    $payload = [
        'titre' => 'Admin CRUD Product',
        'reference' => 'ADM-CRUD-CREATE-001',
        'prix' => 125000,
        'statut' => 'disponible',
        'id_categorie' => $context['category_id'],
        'id_pays' => $context['country_id'],
        'segment' => 'general',
        'description' => 'Created from admin products CRUD test',
        'stock' => 8,
    ];

    $response = $this->postJson('/api/produits', $payload);

    $response
        ->assertCreated()
        ->assertJsonPath('data.titre', 'Admin CRUD Product')
        ->assertJsonPath('data.reference', 'ADM-CRUD-CREATE-001');

    $this->assertDatabaseHas('produits', [
        'titre' => 'Admin CRUD Product',
        'reference' => 'ADM-CRUD-CREATE-001',
        'id_categorie' => $context['category_id'],
        'id_pays' => $context['country_id'],
    ]);
});

it('updates a product through admin api', function () {
    $context = makeAdminProductsContext();
    Sanctum::actingAs($context['admin'], ['*']);

    $product = Produit::query()->create([
        'titre' => 'Admin CRUD Update Source',
        'reference' => 'ADM-CRUD-UPDATE-001',
        'prix' => 98000,
        'statut' => 'disponible',
        'id_categorie' => $context['category_id'],
        'id_pays' => $context['country_id'],
        'date_creation' => now(),
    ]);

    $payload = [
        'titre' => 'Admin CRUD Updated',
        'reference' => 'ADM-CRUD-UPDATE-001',
        'prix' => 111000,
        'statut' => 'disponible',
        'id_categorie' => $context['category_id'],
        'id_pays' => $context['country_id'],
        'segment' => 'general',
        'description_courte' => 'Updated from feature test',
    ];

    $response = $this->putJson('/api/produits/' . $product->id_produit, $payload);

    $response
        ->assertOk()
        ->assertJsonPath('data.titre', 'Admin CRUD Updated');

    $this->assertDatabaseHas('produits', [
        'id_produit' => $product->id_produit,
        'titre' => 'Admin CRUD Updated',
        'prix' => 111000.00,
        'description_courte' => 'Updated from feature test',
    ]);
});

it('soft deletes and restores a product through admin api', function () {
    $context = makeAdminProductsContext();
    Sanctum::actingAs($context['admin'], ['*']);

    $product = Produit::query()->create([
        'titre' => 'Admin CRUD Soft Delete',
        'reference' => 'ADM-CRUD-SOFT-001',
        'prix' => 150000,
        'statut' => 'disponible',
        'id_categorie' => $context['category_id'],
        'id_pays' => $context['country_id'],
        'date_creation' => now(),
    ]);

    $this->deleteJson('/api/produits/' . $product->id_produit)
        ->assertOk();

    $this->assertSoftDeleted('produits', [
        'id_produit' => $product->id_produit,
    ]);

    $this->patchJson('/api/produits/' . $product->id_produit . '/restore')
        ->assertOk();

    $this->assertDatabaseHas('produits', [
        'id_produit' => $product->id_produit,
        'deleted_at' => null,
    ]);
});

it('force deletes a soft deleted product through admin api', function () {
    $context = makeAdminProductsContext();
    Sanctum::actingAs($context['admin'], ['*']);

    $product = Produit::query()->create([
        'titre' => 'Admin CRUD Force Delete',
        'reference' => 'ADM-CRUD-FORCE-001',
        'prix' => 210000,
        'statut' => 'disponible',
        'id_categorie' => $context['category_id'],
        'id_pays' => $context['country_id'],
        'date_creation' => now(),
    ]);

    $this->deleteJson('/api/produits/' . $product->id_produit)
        ->assertOk();

    $this->deleteJson('/api/produits/' . $product->id_produit . '/force')
        ->assertOk();

    $this->assertDatabaseMissing('produits', [
        'id_produit' => $product->id_produit,
    ]);
});

it('returns admin products list for general segment', function () {
    $context = makeAdminProductsContext();
    Sanctum::actingAs($context['admin'], ['*']);

    Produit::query()->create([
        'titre' => 'Admin CRUD List Product',
        'reference' => 'ADM-CRUD-LIST-001',
        'prix' => 99000,
        'statut' => 'disponible',
        'id_categorie' => $context['category_id'],
        'id_pays' => $context['country_id'],
        'date_creation' => now(),
    ]);

    $response = $this->getJson('/api/admin/produits?segment=general&per_page=10');

    $response
        ->assertOk()
        ->assertJsonStructure([
            'data',
            'meta' => ['total', 'per_page', 'current_page', 'last_page'],
            'links' => ['first', 'last', 'next', 'prev'],
        ])
        ->assertJsonFragment(['reference' => 'ADM-CRUD-LIST-001']);
});
