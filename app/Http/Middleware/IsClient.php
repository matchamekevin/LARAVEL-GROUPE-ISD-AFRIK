<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsClient
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if (strtolower((string) ($user->statut ?? '')) !== 'actif' || !($user->can_access_client ?? true)) {
            if ($request->user()?->currentAccessToken()) {
                $request->user()->currentAccessToken()->delete();
            }
            return response()->json(['message' => 'Compte désactivé'], 403);
        }

        return $next($request);
    }
}
