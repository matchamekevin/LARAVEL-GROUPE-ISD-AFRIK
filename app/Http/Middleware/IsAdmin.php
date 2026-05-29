<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! auth()->check()) {
            Log::warning('[IsAdmin] ❌ Utilisateur non authentifié');

            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $user = $request->user();
        $userId = $user->id_utilisateur ?? 'unknown';
        $userStatus = strtolower((string) ($user->statut ?? ''));
        $canAccessAdmin = (bool) ($user->can_access_admin ?? false);

        Log::debug("[IsAdmin] 📋 Vérification admin: ID=$userId, statut=$userStatus, can_access_admin=$canAccessAdmin");

        // ✅ Vérifications correctes (pas strictement false, mais falsy)
        if ($userStatus !== 'actif' || ! $canAccessAdmin) {
            Log::warning("[IsAdmin] ❌ Accès admin refusé pour user $userId (statut=$userStatus, can_access_admin=$canAccessAdmin)");

            // ⚠️ NE PAS supprimer le token ! Laisser le client décider quoi faire
            return response()->json(['message' => 'Accès admin refusé'], 403);
        }

        $isAdminFlag = filter_var($user->is_admin, FILTER_VALIDATE_BOOLEAN);
        $adminRole = strtolower(trim((string) ($user->admin_role ?? '')));

        // Normaliser les alias vers les valeurs canoniques
        if ($adminRole === 'super-admin') {
            $adminRole = 'superadmin';
        }
        if (in_array($adminRole, ['admin_national'], true)) {
            $adminRole = 'admin_pays';
        }
        if ($adminRole === 'admin') {
            $adminRole = 'admin_adjoint';
        }

        $hasAdminRole = in_array($adminRole, ['admin_adjoint', 'admin_pays', 'superadmin'], true);

        if (! $isAdminFlag && ! $hasAdminRole) {
            Log::warning("[IsAdmin] ❌ Utilisateur n'a pas le rôle admin (is_admin=$isAdminFlag, role=$adminRole)");

            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        Log::debug("[IsAdmin] ✅ Accès admin autorisé pour user $userId (role=$adminRole)");

        return $next($request);
    }
}
