<?php

namespace App\Policies;

use App\Models\Utilisateur;

class UtilisateurPolicy
{
    public function viewAny(Utilisateur $authUser): bool
    {
        return $authUser->is_admin;
    }

    public function view(Utilisateur $authUser, Utilisateur $record): bool
    {
        if ($authUser->isSuperAdmin()) {
            return true;
        }

        return $authUser->isAdminPays() && $authUser->id_pays === $record->id_pays;
    }

    public function create(Utilisateur $authUser): bool
    {
        return $authUser->is_admin;
    }

    public function update(Utilisateur $authUser, Utilisateur $record): bool
    {
        if ($authUser->isSuperAdmin()) {
            return true;
        }

        return $authUser->isAdminPays() && $authUser->id_pays === $record->id_pays;
    }

    public function delete(Utilisateur $authUser, Utilisateur $record): bool
    {
        return $authUser->isSuperAdmin();
    }

    public function restore(Utilisateur $authUser, Utilisateur $record): bool
    {
        return $authUser->isSuperAdmin();
    }

    public function forceDelete(Utilisateur $authUser, Utilisateur $record): bool
    {
        return $authUser->isSuperAdmin();
    }
}