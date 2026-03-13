<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Utilisateur;
use App\Policies\UtilisateurPolicy;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Les policies de ton application.
     */
    protected $policies = [
        Utilisateur::class => UtilisateurPolicy::class,
    ];

    /**
     * Enregistrement des policies.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Tu peux aussi définir des Gates ici si besoin
    }
}