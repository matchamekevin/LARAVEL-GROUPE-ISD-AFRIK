<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Services\Base64ImageService;
use App\Traits\UserManagementHelpers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    use UserManagementHelpers;

    public function profile(Request $request)
    {
        try {
            $user = $request->user();
            $portal = $request->query('portal');

            if (! $user) {
                return response()->json(['message' => 'Utilisateur non authentifié'], 401);
            }

            if (! $this->portalAccessAllowed($user, $portal)) {
                return response()->json([
                    'message' => $portal === 'admin' ? 'Accès admin refusé' : 'Compte désactivé',
                ], 403);
            }

            $adminLevel = $this->resolveUserAdminLevel($user);
            $user->load(['formations', 'produits', 'commandes', 'pays']);

            return response()->json([
                'id' => $user->id_utilisateur,
                'id_utilisateur' => $user->id_utilisateur,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'telephone' => $user->telephone,
                'role' => $adminLevel,
                'admin_level' => $adminLevel,
                'admin_role' => $user->admin_role,
                'is_super_admin' => $adminLevel === 'superadmin',
                'is_admin_adjoint' => $adminLevel === 'admin_adjoint',
                'is_admin' => (bool) $user->is_admin,
                'statut' => $user->statut,
                'can_access_client' => (bool) $user->can_access_client,
                'can_access_admin' => (bool) $user->can_access_admin,
                'avatar' => $user->avatar,
                'last_login' => $user->last_login,
                'id_pays' => $user->id_pays,
                'pays' => $user->pays,
                'name' => trim(($user->prenom ?? '').' '.($user->nom ?? '')),
                'formations' => $user->formations,
                'produits' => $user->produits,
                'commandes' => $user->commandes,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            $user = auth()->user();
            if (! $user) {
                return response()->json(['message' => 'Utilisateur non authentifie'], 401);
            }

            $validated = $request->validate([
                'nom' => 'nullable|string|max:100',
                'prenom' => 'nullable|string|max:100',
                'telephone' => 'nullable|string|max:20',
                'email' => [
                    'nullable',
                    'email',
                    Rule::unique('utilisateurs', 'email')
                        ->ignore($user->id_utilisateur, 'id_utilisateur')
                        ->whereNull('deleted_at'),
                ],
            ]);

            $user->fill($validated);
            $user->save();

            return response()->json(['message' => 'Profil mis à jour', 'utilisateur' => $user]);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    public function changePassword(Request $request)
    {
        try {
            $user = auth()->user();
            if (! $user) {
                return response()->json(['message' => 'Utilisateur non authentifie'], 401);
            }

            $data = $request->validate([
                'old' => 'required_without:current_password|string',
                'current_password' => 'required_without:old|string',
                'new' => ['required_without:new_password', 'string', Password::min(6)],
                'new_password' => ['required_without:new', 'string', Password::min(6), 'confirmed'],
            ]);

            $oldPassword = $data['old'] ?? $data['current_password'] ?? null;
            $newPassword = $data['new'] ?? $data['new_password'] ?? null;

            if (! $oldPassword || ! $newPassword || ! Hash::check($oldPassword, $user->mot_de_passe)) {
                return response()->json(['message' => 'Ancien mot de passe incorrect'], 403);
            }

            if (Hash::check($newPassword, $user->mot_de_passe)) {
                return response()->json(['message' => 'Le nouveau mot de passe doit etre different de l\'ancien'], 422);
            }

            $user->mot_de_passe = $newPassword;
            $user->save();

            return response()->json(['message' => 'Mot de passe changé']);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur serveur'], 500);
        }
    }

    public function deleteSelf()
    {
        try {
            $user = auth()->user();
            $user->delete();

            return response()->json(['message' => 'Compte supprimé']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur'], 500);
        }
    }

    public function updateAvatar(Request $request)
    {
        try {
            $request->validate([
                'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
            ]);

            $encoded = Base64ImageService::encode($request->file('avatar'));

            $user = $request->user();
            $user->avatar_data = $encoded['data'];
            $user->avatar_mime = $encoded['mime'];
            $user->avatar = null;
            $user->save();

            return response()->json(['message' => 'Avatar mis à jour', 'avatar_url' => $user->avatar_url]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur', 'error' => $e->getMessage()], 500);
        }
    }

    public function avatarImage($id)
    {
        $user = Utilisateur::find($id);
        if (! $user) {
            abort(404);
        }
        if ($user->avatar_data) {
            return Base64ImageService::response($user->avatar_data, $user->avatar_mime);
        }
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            return response()->file(Storage::disk('public')->path($user->avatar));
        }
        abort(404);
    }
}
