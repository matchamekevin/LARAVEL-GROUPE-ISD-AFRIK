<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Services\GeovisionCatalogSyncService;

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
