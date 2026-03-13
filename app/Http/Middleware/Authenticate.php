<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // Pour les routes API et admin, ne pas rediriger (retourne null = erreur 401 JSON)
        if ($request->expectsJson() || $request->is('admin/*') || $request->is('api/*')) {
            return null;
        }

        // Pour les autres routes, rediriger vers la page d'accueil (React se charge du reste)
        return '/';
    }
}