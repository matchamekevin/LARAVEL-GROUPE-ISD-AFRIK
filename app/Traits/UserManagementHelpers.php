<?php

namespace App\Traits;

use App\Models\Utilisateur;

trait UserManagementHelpers
{
    private function normalizeAdminRoleValue(?string $role): string
    {
        $value = strtolower(trim((string) $role));
        if (in_array($value, ['admin_pays', 'admin_national'], true)) {
            return 'admin_pays';
        }
        if ($value === 'admin_adjoint') {
            return 'admin_adjoint';
        }
        if (in_array($value, ['superadmin', 'super-admin', 'admin'], true)) {
            return 'superadmin';
        }

        return 'client';
    }

    private function resolveAdminLevelFromFlags(bool $isAdmin, bool $canAccessAdmin, ?string $adminRole): string
    {
        if (! $isAdmin || ! $canAccessAdmin) {
            return 'client';
        }

        return $this->normalizeAdminRoleValue($adminRole);
    }

    private function resolveUserAdminLevel(?object $user): string
    {
        if (! $user) {
            return 'client';
        }

        return $this->resolveAdminLevelFromFlags(
            (bool) ($user->is_admin ?? false),
            (bool) ($user->can_access_admin ?? false),
            $user->admin_role ?? null
        );
    }

    private function isSuperAdminUser(?object $user): bool
    {
        if (! $user) {
            return false;
        }

        return (bool) $user->is_admin && $this->normalizeAdminRoleValue($user->admin_role ?? null) === 'superadmin';
    }

    private function portalAccessAllowed(Utilisateur $user, ?string $portal): bool
    {
        if ($user->statut !== 'actif') {
            return false;
        }
        $adminLevel = $this->resolveUserAdminLevel($user);
        $hasAdminAccess = in_array($adminLevel, ['admin_pays', 'admin_adjoint', 'superadmin'], true);

        return match ($portal) {
            'admin' => $hasAdminAccess,
            'client' => (bool) $user->can_access_client,
            default => (bool) $user->can_access_client || $hasAdminAccess,
        };
    }
}
