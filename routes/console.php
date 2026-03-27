<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Services\GeovisionCatalogSyncService;
use Database\Seeders\CategorieProduitSeeder;
use Database\Seeders\IngenierieTypeModeleSeeder;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('geovision:sync {--replace=1} {--without-details}', function (GeovisionCatalogSyncService $service) {
    $this->info('Synchronisation GeoVision officielle en cours...');

    $result = $service->sync(
        replace: (bool) $this->option('replace'),
        fetchDetails: !((bool) $this->option('without-details')),
    );

    $this->table(
        ['Familles', 'Catégories', 'Produits'],
        [[
            $result['families'] ?? 0,
            $result['categories'] ?? 0,
            $result['products'] ?? 0,
        ]]
    );

    $this->info('Synchronisation GeoVision terminée.');
})->purpose('Synchronise le catalogue GeoVision officiel depuis le site constructeur');

Artisan::command('catalog:produits:sync {--with-products=1}', function () {
    $this->info('Synchronisation de la taxonomie Produits...');

    $this->callSilent('db:seed', [
        '--class' => CategorieProduitSeeder::class,
        '--force' => true,
    ]);

    if ((bool) $this->option('with-products')) {
        $this->callSilent('db:seed', [
            '--class' => IngenierieTypeModeleSeeder::class,
            '--force' => true,
        ]);
    }

    $this->info('Synchronisation Produits terminee.');
    $this->line('Commande executee: categories (et produits demo si active).');
})->purpose('Resynchronise l arborescence Produits et optionnellement les produits de demo');

Artisan::command('catalog:ingenierie:sync {--with-products=1}', function () {
    $this->call('catalog:produits:sync', [
        '--with-products' => $this->option('with-products'),
    ]);
})->purpose('Alias legacy vers catalog:produits:sync');
