<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class IsClient
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if (! $user) {
            Log::warning('[IsClient] ❌ Utilisateur non authentifié');

            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $userId = $user->id_utilisateur ?? 'unknown';
        $userStatus = strtolower((string) ($user->statut ?? ''));
        $canAccessClient = (bool) ($user->can_access_client ?? true);

        Log::debug("[IsClient] 📋 Vérification utilisateur: ID=$userId, statut=$userStatus, can_access_client=$canAccessClient");

        // ✅ Vérifications correctes (pas strictement false, mais falsy)
        if ($userStatus !== 'actif' || ! $canAccessClient) {
            Log::warning("[IsClient] ❌ Accès refusé pour user $userId (statut=$userStatus, can_access_client=$canAccessClient)");

            // ⚠️ NE PAS supprimer le token ! Laisser le client décider quoi faire
            return response()->json(['message' => 'Accès client refusé'], 403);
        }

        Log::debug("[IsClient] ✅ Accès autorisé pour user $userId");

        return $next($request);
    }
}
