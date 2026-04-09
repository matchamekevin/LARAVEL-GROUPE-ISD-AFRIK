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

        $isAdminFlag = filter_var($user->is_admin, FILTER_VALIDATE_BOOLEAN);
        $adminRole = strtolower(trim((string) ($user->admin_role ?? '')));

        if (in_array($adminRole, ['admin', 'admin_pays', 'admin_national'], true)) {
            $adminRole = 'admin_adjoint';
        }
        if ($adminRole === 'super-admin') {
            $adminRole = 'superadmin';
        }

        $hasAdminRole = in_array($adminRole, ['admin_adjoint', 'superadmin'], true);

        if (!$isAdminFlag && !$hasAdminRole) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        return $next($request);
    }
}