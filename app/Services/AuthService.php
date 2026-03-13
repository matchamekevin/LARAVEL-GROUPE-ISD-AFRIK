<?php

namespace App\Services;

use App\Models\Utilisateur;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

/**
 * Service centralisé pour la gestion des utilisateurs :
 * - Inscription
 * - Connexion avec 2FA pour les admins
 * - Vérification du code 2FA
 * - Déconnexion
 * - Profil
 * - Mise à jour du profil
 * - Changement de mot de passe
 */
class AuthService
{
    /**
     * Inscription d'un nouvel utilisateur.
     */
    public function register(array $data): Utilisateur
    {
        $data['date_creation'] = now();
        $data['statut'] = 'actif';
        $data['mot_de_passe'] = Hash::make($data['mot_de_passe']);

        return Utilisateur::create($data);
    }

    /**
     * Connexion d'un utilisateur avec 2FA si admin.
     * Exclut les comptes supprimés (soft delete).
     */
    public function login(array $credentials): ?array
    {
        $user = Utilisateur::where('email', $credentials['email'])
            ->whereNull('deleted_at') // exclut les comptes soft-deleted
            ->first();

        if (!$user || !Hash::check($credentials['mot_de_passe'], $user->mot_de_passe)) {
            return null;
        }

        // ✅ Déclenchement du 2FA si admin
        if ($user->role === 'admin') {
            if (method_exists($user, 'generateTwoFactorCode')) {
                $user->generateTwoFactorCode();
            }
            return [
                '2fa_required' => true,
                'user_id' => $user->id_utilisateur
            ];
        }

        // ✅ Client : token direct
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token
        ];
    }

    /**
     * Vérification du code 2FA pour les admins.
     */
    public function verifyTwoFactorCode(Utilisateur $user, string $code): ?array
    {
        if (
            $user->two_factor_code !== $code ||
            now()->greaterThan($user->two_factor_expires_at)
        ) {
            return null;
        }

        if (method_exists($user, 'resetTwoFactorCode')) {
            $user->resetTwoFactorCode();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token
        ];
    }

    /**
     * Déconnexion : suppression de tous les tokens.
     */
    public function logout(): void
    {
        $user = Auth::user();
        if ($user) {
            $user->tokens()->delete();
        }
    }

    /**
     * Récupération du profil de l'utilisateur connecté.
     */
    public function profile(): ?Utilisateur
    {
        return Auth::user();
    }

    /**
     * Mise à jour du profil utilisateur.
     */
    public function updateProfile(array $data): Utilisateur
    {
        $user = Auth::user();
        $user->update($data);

        return $user;
    }

    /**
     * Changement de mot de passe sécurisé.
     */
    public function changePassword(string $old, string $new): bool
    {
        $user = Auth::user();

        if (!Hash::check($old, $user->mot_de_passe)) {
            return false;
        }

        $user->update([
            'mot_de_passe' => Hash::make($new)
        ]);

        return true;
    }
}