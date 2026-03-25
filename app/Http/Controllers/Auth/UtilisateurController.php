<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use App\Services\AuthService;
use Illuminate\Validation\Rule;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\TwoFactorCodeMail;
use App\Mail\AccountSuspendedMail;
use App\Mail\AccountReactivatedMail;
use App\Mail\AccountAccessUpdatedMail;
use App\Mail\AdminCreatedMail;
use App\Jobs\SendTwoFactorCodeJob;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class UtilisateurController extends Controller
{
    protected AuthService $auth;

    public function __construct(AuthService $auth)
    {
        $this->auth = $auth;
    }

    private function normalizeRoleValue(?string $role): string
    {
        $value = strtolower(trim((string) $role));

        if (in_array($value, ['admin', 'admin_pays', 'admin_national', 'admin_adjoint'], true)) {
            return 'admin_adjoint';
        }

        if ($value === 'superadmin') {
            return 'superadmin';
        }

        return 'client';
    }

    private function isSuperAdminUser(?Utilisateur $user): bool
    {
        if (!$user) {
            return false;
        }

        return (bool) $user->is_admin
            && $this->normalizeRoleValue($user->admin_role ?: $user->role) === 'superadmin';
    }

    private function canActorManageUser(?Utilisateur $actor, Utilisateur $target): bool
    {
        if (!$actor) {
            return false;
        }

        if ($this->isSuperAdminUser($actor)) {
            return true;
        }

        return !$this->isSuperAdminUser($target);
    }

    private function portalAccessAllowed(Utilisateur $user, ?string $portal): bool
    {
        if ($user->statut !== 'actif') {
            return false;
        }

        $normalizedRole = $this->normalizeRoleValue($user->admin_role ?: $user->role);
        $hasAdminRole = in_array($normalizedRole, ['admin_adjoint', 'superadmin'], true);

        if ($portal === 'admin') {
            return $hasAdminRole
                && (bool) $user->is_admin
                && (bool) $user->can_access_admin;
        }

        if ($portal === 'client') {
            return (bool) $user->can_access_client;
        }

        return (bool) $user->can_access_client || ((bool) $user->can_access_admin && $hasAdminRole);
    }

    private function invalidateUserSessions(Utilisateur $user): void
    {
        $user->tokens()->delete();

        DB::table('sessions')
            ->where('user_id', (string) $user->getAuthIdentifier())
            ->orWhere('user_id', $user->getAuthIdentifier())
            ->delete();
    }

    private function buildAccessMailPayload(Utilisateur $before, Utilisateur $after): ?array
    {
        $roleBefore = $this->normalizeRoleValue($before->admin_role ?: $before->role);
        $roleAfter = $this->normalizeRoleValue($after->admin_role ?: $after->role);

        $removed = [];
        if ($before->can_access_client && !$after->can_access_client) {
            $removed[] = "Acces a l'espace client";
        }
        if ($before->can_access_admin && !$after->can_access_admin) {
            $removed[] = "Acces a l'espace administrateur";
        }
        if ($roleBefore !== $roleAfter) {
            $removed[] = 'Rôle précédent: ' . $this->roleLabel($roleBefore);
        }

        $remaining = [];
        if ($after->can_access_client) {
            $remaining[] = 'Accès client actif';
        }
        if ($after->can_access_admin) {
            $remaining[] = 'Accès administrateur actif';
        }

        $roleChanged = $roleBefore !== $roleAfter;
        $accessChanged = (bool) $before->can_access_client !== (bool) $after->can_access_client
            || (bool) $before->can_access_admin !== (bool) $after->can_access_admin;

        if (!$roleChanged && !$accessChanged) {
            return null;
        }

        return [
            'old_role' => $this->roleLabel($roleBefore),
            'new_role' => $this->roleLabel($roleAfter),
            'removed' => $removed,
            'remaining' => $remaining,
            'status' => (string) $after->statut,
        ];
    }

    private function roleLabel(?string $role): string
    {
        return match ($this->normalizeRoleValue($role)) {
            'superadmin' => 'Super admin',
            'admin_adjoint' => 'Admin adjoint',
            default => 'Client',
        };
    }

    private function syncRoleAndAccessPayload(array &$validated, Utilisateur $user): void
    {
        if (!array_key_exists('role', $validated)) {
            return;
        }

        $selectedRole = $this->normalizeRoleValue((string) $validated['role']);
        $validated['role'] = $selectedRole;
        $validated['is_admin'] = in_array($selectedRole, ['admin_adjoint', 'superadmin'], true);
        $validated['admin_role'] = $validated['is_admin'] ? $selectedRole : 'client';

        if ($selectedRole === 'client') {
            $validated['can_access_admin'] = false;
            if (!array_key_exists('can_access_client', $validated) && !(bool) $user->can_access_client) {
                $validated['can_access_client'] = true;
            }
            return;
        }

        if (!array_key_exists('can_access_admin', $validated)) {
            $validated['can_access_admin'] = true;
        }
    }

    private function generateTemporaryPassword(): string
    {
        return Str::upper(Str::random(4)) . random_int(1000, 9999) . '!';
    }

    /**
     * 📝 Inscription d'un utilisateur (public).
     */
    public function register(Request $request)
{
    try {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => [
                'required',
                'email',
                Rule::unique('utilisateurs', 'email')->whereNull('deleted_at')
            ],
            'telephone' => 'required|string|max:20',
            'mot_de_passe' => 'required|string|min:6',
            'mot_de_passe_confirmation' => 'nullable|same:mot_de_passe',
            'id_pays' => 'required|exists:pays,id_pays',
            'two_factor_enabled' => 'nullable|boolean',
        ], [
            'email.unique' => "Cet email est déjà utilisé par un autre compte actif.",
            'id_pays.required' => "Le pays est obligatoire.",
            'id_pays.exists' => "Le pays sélectionné n'existe pas."
        ]);

        // L'inscription publique crée toujours un compte client standard.
        $validated['role'] = 'client';
        $validated['is_admin'] = false;
        $validated['admin_role'] = 'client';
        $validated['statut'] = 'actif';
        $validated['can_access_client'] = true;
        $validated['can_access_admin'] = false;

        $user = Utilisateur::create($validated);

        // Si 2FA activé pour l'utilisateur, générer et envoyer un OTP immédiatement
        try {
            if ($user->two_factor_enabled) {
                $user->generateTwoFactorCode();
                try {
                    Mail::to($user->email)->send(new TwoFactorCodeMail($user));
                } catch (\Throwable $mailEx) {
                    Log::warning('Envoi OTP inscription échoué: ' . $mailEx->getMessage());
                }
            }
        } catch (\Throwable $e) {
            // Ne pas bloquer l'inscription si génération/ envoi OTP échoue
            Log::error('Erreur génération/envoi OTP après inscription: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Inscription réussie',
            'user' => $user->load('pays')
        ], 201);

    } catch (ValidationException $e) {
        return response()->json([
            'message' => 'Erreur lors de l\'inscription',
            'errors' => $e->errors()
        ], 422);
    } catch (QueryException $e) {
        // Gestion d'erreurs SQL spécifiques sans exposer les détails techniques
        $code = $e->getCode();
        if ($code == "23000") {
            return response()->json([
                'message' => 'Erreur lors de l\'inscription',
                'error' => 'Cet email est déjà utilisé.'
            ], 409);
        }

        // Not-null violation (Postgres 23502) — log and return friendly message
        if ($code == '23502') {
            Log::error('QueryException 23502 lors inscription: ' . $e->getMessage());
            return response()->json([
                'message' => 'Impossible de créer le compte pour le moment. Données manquantes ou format incorrect.'
            ], 400);
        }

        // Autres erreurs SQL — log et message générique
        Log::error('QueryException lors inscription: ' . $e->getMessage());
        return response()->json([
            'message' => 'Erreur serveur lors de l\'inscription.'
        ], 500);
    } catch (\Throwable $e) {
        Log::error('Exception inattendue lors inscription: ' . $e->getMessage());
        return response()->json([
            'message' => 'Erreur serveur. Veuillez réessayer plus tard.'
        ], 500);
    }
}
    /**
     * 🔐 Connexion avec 2FA pour TOUS les utilisateurs.
     */
    public function login(Request $request)
    {
        try {
            // ✅ Validation des credentials
            $credentials = $request->validate([
                'email'        => 'required|email',
                'mot_de_passe' => 'required|string|min:6',
                'portal'       => 'nullable|in:client,admin',
            ]);

            // ✅ Recherche de l'utilisateur
            $user = Utilisateur::where('email', $credentials['email'])->first();

            if (!$user || !Hash::check($credentials['mot_de_passe'], $user->mot_de_passe)) {
                return response()->json([
                    'message' => __('auth.failed')
                ], 401);
            }

            $portal = $credentials['portal'] ?? null;

            if (!$this->portalAccessAllowed($user, $portal)) {
                return response()->json([
                    'message' => $portal === 'admin' ? 'Accès admin refusé' : 'Compte désactivé'
                ], 403);
            }

            // 🔐 Si 2FA est activé
            if ($user->two_factor_enabled) {


                // Génération du code OTP
                $user->generateTwoFactorCode();

                // Envoyer l'email immédiatement (évite la dépendance au worker en dev)
                try {
                    Mail::to($user->email)->send(new TwoFactorCodeMail($user));
                } catch (\Throwable $e) {
                    // Ne pas interrompre la connexion si l'envoi échoue; loggons
                    Log::error('Erreur envoi 2FA: ' . $e->getMessage());
                }

                $payload = [
                    'message'      => 'Code OTP généré',
                    'user_id'      => $user->id_utilisateur,
                    'email'        => $user->email,
                    'requires_2fa' => true,
                    'portal'       => $portal,
                ];

                return response()->json($payload, 200);
            }

            // ✅ Connexion classique sans 2FA
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message'      => 'Connexion réussie',
                'token'        => $token,
                'user'         => $user->load('pays'),
                'role'         => $user->role,
                'requires_2fa' => false
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Erreur login: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la connexion',
            ], 500);
        }
    }

    /**
     * 🔐 Vérification du code 2FA.
     */
    public function verify2FA(Request $request)
    {
        try {
            // ✅ Validation des données
            $data = $request->validate([
                'user_id' => 'required|integer|exists:utilisateurs,id_utilisateur',
                'code'    => 'required|string|size:6',
                'portal'  => 'nullable|in:client,admin',
            ]);

            // ✅ Récupération de l'utilisateur
            $user = Utilisateur::find($data['user_id']);

            if (!$user) {
                return response()->json([
                    'message' => 'Utilisateur introuvable'
                ], 404);
            }

            if (!$this->portalAccessAllowed($user, $data['portal'] ?? null)) {
                return response()->json([
                    'message' => ($data['portal'] ?? null) === 'admin' ? 'Accès admin refusé' : 'Compte désactivé'
                ], 403);
            }

            // 🔐 Vérification du code OTP
            if ($user->two_factor_code !== $data['code']) {
                return response()->json([
                    'message' => 'Code invalide'
                ], 403);
            }

            // 🔐 Vérification de l'expiration
            if (!$user->two_factor_expires_at || now()->greaterThan($user->two_factor_expires_at)) {
                return response()->json([
                    'message' => 'Code expiré'
                ], 403);
            }

            // ✅ Réinitialiser le code OTP
            $user->resetTwoFactorCode();

            // ✅ Mettre à jour la dernière connexion
            $user->last_login = now();
            $user->save();

            // 🔑 Générer un token Sanctum
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message'      => 'Connexion réussie',
                'user'         => $user->load('pays'),
                'role'         => $user->role,
                'token'        => $token,
                'requires_2fa' => false
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors'  => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Erreur verify2FA: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la vérification',
            ], 500);
        }
    }

    /**
     * 🔄 Renvoyer un nouveau code 2FA.
     */
    public function resend2FACode(Request $request)
    {
        try {
            $data = $request->validate([
                'user_id' => 'required|integer|exists:utilisateurs,id_utilisateur',
                'portal'  => 'nullable|in:client,admin',
            ]);

            $user = Utilisateur::find($data['user_id']);

            if (!$user) {
                return response()->json([
                    'message' => 'Utilisateur introuvable'
                ], 404);
            }

            if (!$this->portalAccessAllowed($user, $data['portal'] ?? null)) {
                return response()->json([
                    'message' => ($data['portal'] ?? null) === 'admin' ? 'Accès admin refusé' : 'Compte désactivé'
                ], 403);
            }

            $user->generateTwoFactorCode();

            try {
                Mail::to($user->email)->send(new TwoFactorCodeMail($user));
            } catch (\Throwable $e) {
                Log::error('Erreur envoi resend2FA: ' . $e->getMessage());
            }

            return response()->json(['message' => 'Nouveau code envoyé'], 200);

        } catch (\Throwable $e) {
            Log::error('Erreur resend2FA: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors du renvoi du code',
            ], 500);
        }
    }

    /**
     * 🔐 Déconnexion.
     */
    public function logout()
    {
        try {
            $this->auth->logout();
            return response()->json([
                'message' => 'Déconnexion réussie'
            ]);
        } catch (\Throwable $e) {
            Log::error('Erreur logout: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la déconnexion',
            ], 500);
        }
    }

    /**
     * 👤 Profil utilisateur.
     */
    public function profile(Request $request)
    {
        try {
            $user = $request->user();
            $portal = $request->query('portal');

            if (!$user) {
                return response()->json([
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            if (!$this->portalAccessAllowed($user, $portal)) {
                if ($request->user()?->currentAccessToken()) {
                    $request->user()->currentAccessToken()->delete();
                }

                return response()->json([
                    'message' => $portal === 'admin' ? 'Accès admin refusé' : 'Compte désactivé'
                ], 403);
            }

            // Charger les relations
            $user->load(['formations', 'produits', 'commandes', 'pays']);

            return response()->json([
                'id'             => $user->id_utilisateur,
                'id_utilisateur' => $user->id_utilisateur,
                'nom'            => $user->nom,
                'prenom'         => $user->prenom,
                'email'          => $user->email,
                'telephone'      => $user->telephone,
                'role'           => $user->role,
                'admin_role'     => $user->admin_role,
                'is_admin'       => (bool) $user->is_admin,
                'statut'         => $user->statut,
                'can_access_client' => (bool) $user->can_access_client,
                'can_access_admin'  => (bool) $user->can_access_admin,
                'avatar'         => $user->avatar,
                'last_login'     => $user->last_login,
                'id_pays'        => $user->id_pays,
                'pays'           => $user->pays,
                'name'           => trim(($user->prenom ?? '') . ' ' . ($user->nom ?? '')),
                'formations'     => $user->formations,   // ⚡ formations souscrites
                'produits'       => $user->produits,     // ⚡ produits achetés
                'commandes'      => $user->commandes,    // ⚡ commandes passées
            ]);
        } catch (\Throwable $e) {
            Log::error('Erreur profile: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
            ], 500);
        }
    }

    /**
     * 🛠️ Mise à jour du profil.
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user) {
                return response()->json([
                    'message' => 'Utilisateur non authentifie'
                ], 401);
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
                        ->whereNull('deleted_at')
                ],
            ]);

            $user->fill($validated);

            $user->save();

            return response()->json([
                'message' => 'Profil mis à jour',
                'utilisateur' => $user
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Erreur updateProfile: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * 🔐 Changement de mot de passe.
     */
    public function changePassword(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user) {
                return response()->json([
                    'message' => 'Utilisateur non authentifie'
                ], 401);
            }

            $data = $request->validate([
                'old' => 'required_without:current_password|string',
                'current_password' => 'required_without:old|string',
                'new' => ['required_without:new_password', 'string', Password::min(6)],
                'new_password' => ['required_without:new', 'string', Password::min(6), 'confirmed'],
            ]);

            $oldPassword = $data['old'] ?? $data['current_password'] ?? null;
            $newPassword = $data['new'] ?? $data['new_password'] ?? null;

            if (!$oldPassword || !$newPassword || !Hash::check($oldPassword, $user->mot_de_passe)) {
                return response()->json([
                    'message' => 'Ancien mot de passe incorrect'
                ], 403);
            }

            if (Hash::check($newPassword, $user->mot_de_passe)) {
                return response()->json([
                    'message' => 'Le nouveau mot de passe doit etre different de l\'ancien'
                ], 422);
            }

            $user->mot_de_passe = $newPassword;
            $user->save();

            return response()->json([
                'message' => 'Mot de passe changé'
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Erreur changePassword: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * 🛠️ Liste des utilisateurs (admin).
     */
    public function index(Request $request)
    {
        try {
            $actor = $request->user();
            $query = Utilisateur::whereNull('deleted_at')->orderBy('id_utilisateur');

            if (!$this->isSuperAdminUser($actor)) {
                $query->where(function ($builder) {
                    $builder
                        ->where('role', '!=', 'superadmin')
                        ->where('admin_role', '!=', 'superadmin');
                });
            }

            $utilisateurs = $query->get();
            return response()->json($utilisateurs);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🛠️ Afficher un utilisateur (admin).
     */
    public function show(Request $request, $id)
    {
        try {
            $user = Utilisateur::findOrFail($id);
            if (!$this->canActorManageUser($request->user(), $user)) {
                return response()->json([
                    'message' => 'Accès refusé à ce compte.'
                ], 403);
            }
            return response()->json($user);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Utilisateur introuvable',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * 🛠️ Mise à jour utilisateur (admin).
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'nom' => 'nullable|string',
                'prenom' => 'nullable|string',
                'email' => [
                    'nullable',
                    'email',
                    Rule::unique('utilisateurs', 'email')
                        ->ignore($id, 'id_utilisateur')
                        ->whereNull('deleted_at')
                ],
                'telephone' => 'nullable|string',
                'role' => 'nullable|in:client,admin,admin_pays,admin_national,admin_adjoint,superadmin',
                'statut' => 'nullable|in:actif,inactif,suspendu',
                'can_access_client' => 'nullable|boolean',
                'can_access_admin' => 'nullable|boolean',
            ]);

            $user = Utilisateur::findOrFail($id);
            $actor = $request->user();

            if (!$this->canActorManageUser($actor, $user)) {
                return response()->json([
                    'message' => 'Action interdite: un admin adjoint ne peut pas gérer un super admin.'
                ], 403);
            }

            if (
                array_key_exists('role', $validated)
                && $this->normalizeRoleValue((string) $validated['role']) === 'superadmin'
                && !$this->isSuperAdminUser($actor)
            ) {
                return response()->json([
                    'message' => 'Seul un super admin peut attribuer ce rôle.'
                ], 403);
            }

            $before = $user->replicate();

            $this->syncRoleAndAccessPayload($validated, $user);

            // Si statut suspendu/inactif sans précision fine, on coupe les 2 accès.
            if (array_key_exists('statut', $validated) && in_array((string) $validated['statut'], ['suspendu', 'inactif'], true)) {
                $validated['can_access_client'] = false;
                $validated['can_access_admin'] = false;
            }

            if (
                array_key_exists('can_access_admin', $validated)
                && $validated['can_access_admin']
                && $this->normalizeRoleValue($validated['role'] ?? $user->role) === 'client'
            ) {
                $validated['can_access_admin'] = false;
            }

            $user->update($validated);
            $user->refresh();

            $statusChanged = (string) $before->statut !== (string) $user->statut;
            $roleChanged = $this->normalizeRoleValue($before->admin_role ?: $before->role)
                !== $this->normalizeRoleValue($user->admin_role ?: $user->role);
            $accessChanged = (bool) $before->can_access_client !== (bool) $user->can_access_client
                || (bool) $before->can_access_admin !== (bool) $user->can_access_admin;

            if ($roleChanged || $accessChanged || $statusChanged) {
                $this->invalidateUserSessions($user);
            }

            if ($statusChanged) {
                if ($user->statut === 'suspendu') {
                    try {
                        Mail::to($user->email)->send(new AccountSuspendedMail($user));
                    } catch (\Throwable $e) {
                        Log::warning('Erreur envoi email suspension: ' . $e->getMessage());
                    }
                } elseif ($user->statut === 'actif' && $before->statut === 'suspendu') {
                    try {
                        Mail::to($user->email)->send(new AccountReactivatedMail($user));
                    } catch (\Throwable $e) {
                        Log::warning('Erreur envoi email réactivation: ' . $e->getMessage());
                    }
                }
            }

            $mailPayload = $this->buildAccessMailPayload($before, $user);
            if ($mailPayload) {
                try {
                    Mail::to($user->email)->send(new AccountAccessUpdatedMail($user, $mailPayload));
                } catch (\Throwable $e) {
                    Log::warning('Erreur envoi email role/acces: ' . $e->getMessage());
                }
            }

            return response()->json([
                'message' => 'Utilisateur mis à jour',
                'utilisateur' => $user
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🗑️ Suppression (admin).
     */
    public function destroy($id)
    {
        try {
            $user = Utilisateur::findOrFail($id);
            $actor = auth()->user();

            if (!$this->canActorManageUser($actor, $user)) {
                return response()->json([
                    'message' => 'Action interdite: un admin adjoint ne peut pas supprimer un super admin.'
                ], 403);
            }

            $this->invalidateUserSessions($user);
            $user->delete();

            return response()->json([
                'message' => 'Utilisateur supprimé'
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🗑️ Suppression de son propre compte.
     */
    public function deleteSelf()
    {
        try {
            $user = auth()->user();
            $user->delete();

            return response()->json([
                'message' => 'Compte supprimé'
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ♻️ Restauration (admin).
     */
    public function restore($id)
    {
        try {
            $user = Utilisateur::withTrashed()->findOrFail($id);
            if (!$this->canActorManageUser(auth()->user(), $user)) {
                return response()->json([
                    'message' => 'Action interdite: un admin adjoint ne peut pas restaurer un super admin.'
                ], 403);
            }

            if (!$user->trashed()) {
                return response()->json([
                    'message' => 'Compte déjà actif'
                ], 400);
            }

            $user->restore();

            return response()->json([
                'message' => 'Utilisateur restauré',
                'utilisateur' => $user
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function storeAdminAdjoint(Request $request)
    {
        $actor = $request->user();

        if (!$this->isSuperAdminUser($actor)) {
            return response()->json([
                'message' => 'Accès réservé au super administrateur.'
            ], 403);
        }

        try {
            $validated = $request->validate([
                'nom' => 'required|string|max:100',
                'prenom' => 'required|string|max:100',
                'email' => [
                    'required',
                    'email',
                    Rule::unique('utilisateurs', 'email')->whereNull('deleted_at'),
                ],
                'telephone' => 'nullable|string|max:20',
                'id_pays' => 'nullable|exists:pays,id_pays',
                'can_access_client' => 'nullable|boolean',
                'two_factor_enabled' => 'nullable|boolean',
            ]);

            $password = $this->generateTemporaryPassword();
            $admin = Utilisateur::create([
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $validated['email'],
                'telephone' => $validated['telephone'] ?? null,
                'mot_de_passe' => $password,
                'role' => 'admin_adjoint',
                'admin_role' => 'admin_adjoint',
                'is_admin' => true,
                'statut' => 'actif',
                'can_access_admin' => true,
                'can_access_client' => (bool) ($validated['can_access_client'] ?? false),
                'two_factor_enabled' => (bool) ($validated['two_factor_enabled'] ?? true),
                'id_pays' => $validated['id_pays'] ?? $actor->id_pays,
                'date_creation' => now(),
            ]);

            try {
                Mail::to($admin->email)->send(new AdminCreatedMail($admin, $password));
            } catch (\Throwable $e) {
                Log::warning('Erreur envoi email creation admin adjoint: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Compte admin adjoint créé avec succès.',
                'utilisateur' => $admin->load('pays'),
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Erreur creation admin adjoint: ' . $e->getMessage());

            return response()->json([
                'message' => 'Erreur lors de la création du compte admin adjoint.',
            ], 500);
        }
    }

    /**
     * 🖼️ Mise à jour avatar.
     */
    public function updateAvatar(Request $request)
    {
        try {
            $request->validate([
                'avatar' => 'required|image|mimes:jpg,jpeg,png|max:2048',
            ]);

            $path = $request->file('avatar')->store('avatars', 'public');

            $user = $request->user();
            $user->avatar = $path;
            $user->save();

            return response()->json([
                'message' => 'Avatar mis à jour',
                'avatar' => $path,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
