<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $user = $request->user();

        // ✅ Vérifie plusieurs cas possibles
        if (
            !$user->is_admin && 
            !in_array($user->role, ['admin', 'super_admin'])
        ) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        return $next($request);
    }
}