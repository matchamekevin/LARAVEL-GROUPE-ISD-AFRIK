<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Database\Eloquent\Relations\Relation;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
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

        // Forcer le schéma HTTPS en production (utile derrière un proxy comme Render)
        try {
            $appEnv = config('app.env');
        } catch (\Exception $e) {
            $appEnv = env('APP_ENV');
        }

        $appUrl = env('APP_URL', '');
        if ($appEnv === 'production' || stripos($appUrl, 'https://') === 0) {
            URL::forceScheme('https');
        }
    }
}