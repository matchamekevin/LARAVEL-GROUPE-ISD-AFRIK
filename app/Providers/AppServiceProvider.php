<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
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
    }
}