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

        $role = strtolower(trim((string) ($user->admin_role ?? '')));
        if ($role === 'super-admin') {
            $role = 'superadmin';
        }
        if ($role === 'admin') {
            $role = 'superadmin';
        }

        $isSuperAdmin = $user
            && (bool) $user->is_admin
            && $role === 'superadmin'
            && (bool) $user->can_access_admin
            && strtolower((string) ($user->statut ?? '')) === 'actif';

        if (! $isSuperAdmin) {
            return response()->json(['message' => 'Accès réservé au super administrateur'], 403);
        }

        return $next($request);
    }
}
