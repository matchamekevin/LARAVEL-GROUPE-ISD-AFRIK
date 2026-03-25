<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $role = strtolower((string) ($user->admin_role ?: $user->role));
        $isSuperAdmin = $user
            && (bool) $user->is_admin
            && in_array($role, ['superadmin', 'super-admin'], true)
            && (bool) $user->can_access_admin
            && strtolower((string) ($user->statut ?? '')) === 'actif';

        if (!$isSuperAdmin) {
            return response()->json(['message' => 'Accès réservé au super administrateur'], 403);
        }

        return $next($request);
    }
}
