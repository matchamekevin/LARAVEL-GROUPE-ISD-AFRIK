<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsClient
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if (!$user || $user->role !== 'client') {
            return response()->json(['message' => 'Accès refusé. Réservé aux clients.'], 403);
        }

        return $next($request);
    }
}