<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Ajout de crossorigin aux scripts Vite en dev pour les imports dynamiques cross-origin
        Vite::useScriptTagAttributes([
            'crossorigin' => 'anonymous',
        ]);

        // Configuration du morph map pour les relations polymorphiques
        Relation::enforceMorphMap([
            'utilisateur' => 'App\Models\Utilisateur',
            'FORMATION' => 'App\Models\Formation',
            'PRODUIT' => 'App\Models\Produit',
            'commande' => 'App\Models\Commande',
            'BLOG' => 'App\Models\Blog',
            'user' => 'App\Models\User',

            // Ajoutez d'autres modèles si nécessaire
        ]);

        // Forcer le schéma HTTPS uniquement en production.
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
