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
            'formation' => 'App\Models\Formation',
            'produit' => 'App\Models\Produit',
            'commande' => 'App\Models\Commande',
            'blog' => 'App\Models\Blog',
            'user' => 'App\Models\User',
            
            // Ajoutez d'autres modèles si nécessaire
        ]);
    }
}