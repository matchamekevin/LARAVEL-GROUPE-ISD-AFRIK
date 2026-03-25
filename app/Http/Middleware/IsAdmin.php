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

        if (strtolower((string) ($user->statut ?? '')) !== 'actif' || !($user->can_access_admin ?? false)) {
            if ($request->user()?->currentAccessToken()) {
                $request->user()->currentAccessToken()->delete();
            }
            return response()->json(['message' => 'Compte désactivé'], 403);
        }

        // Accepte les anciens et nouveaux rôles admin pour éviter les blocages.
        $adminRoles = ['admin', 'super_admin', 'admin_pays', 'admin_national', 'admin_adjoint', 'superadmin'];
        $isAdminFlag = filter_var($user->is_admin, FILTER_VALIDATE_BOOLEAN);
        $hasAdminRole = in_array((string) $user->role, $adminRoles, true);

        if (!$isAdminFlag && !$hasAdminRole) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        return $next($request);
    }
}