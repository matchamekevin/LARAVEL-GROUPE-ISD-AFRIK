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
use App\Jobs\SendTwoFactorCodeJob;
use Illuminate\Support\Facades\Log;

class UtilisateurController extends Controller
{
    protected AuthService $auth;

    public function __construct(AuthService $auth)
    {
        $this->auth = $auth;
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
            'role' => 'nullable|in:client,admin_pays,admin_national,superadmin',
            'is_admin' => 'nullable|boolean',
            'admin_role' => 'nullable|string|max:50',
            'statut' => 'nullable|in:actif,inactif,suspendu',
            'two_factor_enabled' => 'nullable|boolean',
        ], [
            'email.unique' => "Cet email est déjà utilisé par un autre compte actif.",
            'id_pays.required' => "Le pays est obligatoire.",
            'id_pays.exists' => "Le pays sélectionné n'existe pas."
        ]);

        // Si aucun rôle n'est spécifié, mettre "client" par défaut
        if (!isset($validated['role'])) {
            $validated['role'] = 'client';
            $validated['is_admin'] = false;
        }

        // Si le rôle est admin, vérifier is_admin
        if (in_array($validated['role'], ['admin_pays', 'admin_national', 'superadmin'])) {
            $validated['is_admin'] = true;
        } else {
            $validated['is_admin'] = false;
        }

        // Statut par défaut
        if (!isset($validated['statut'])) {
            $validated['statut'] = 'actif';
        }

        $user = Utilisateur::create($validated);

        // Si 2FA activé pour l'utilisateur, générer et envoyer un OTP immédiatement
        try {
            if ($user->two_factor_enabled) {
                $user->generateTwoFactorCode();
                try {
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\TwoFactorCodeMail($user));
                } catch (\Throwable $mailEx) {
                    \Log::warning('Envoi OTP inscription échoué: ' . $mailEx->getMessage());
                }
            }
        } catch (\Throwable $e) {
            // Ne pas bloquer l'inscription si génération/ envoi OTP échoue
            \Log::error('Erreur génération/envoi OTP après inscription: ' . $e->getMessage());
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
            \Log::error('QueryException 23502 lors inscription: ' . $e->getMessage());
            return response()->json([
                'message' => 'Impossible de créer le compte pour le moment. Données manquantes ou format incorrect.'
            ], 400);
        }

        // Autres erreurs SQL — log et message générique
        \Log::error('QueryException lors inscription: ' . $e->getMessage());
        return response()->json([
            'message' => 'Erreur serveur lors de l\'inscription.'
        ], 500);
    } catch (\Throwable $e) {
        \Log::error('Exception inattendue lors inscription: ' . $e->getMessage());
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
            ]);

            // ✅ Recherche de l'utilisateur
            $user = Utilisateur::where('email', $credentials['email'])->first();

            if (!$user || !Hash::check($credentials['mot_de_passe'], $user->mot_de_passe)) {
                return response()->json([
                    'message' => 'Identifiants invalides'
                ], 401);
            }

            if (!$user->statut) {
                return response()->json([
                    'message' => 'Compte désactivé'
                ], 403);
            }

            // 🔐 Si 2FA est activé
            if ($user->two_factor_enabled) {


                // Génération du code OTP
                $user->generateTwoFactorCode();

                // Envoyer l'email immédiatement (évite la dépendance au worker en dev)
                try {
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\TwoFactorCodeMail($user));
                } catch (\Throwable $e) {
                    // Ne pas interrompre la connexion si l'envoi échoue; loggons
                    \Illuminate\Support\Facades\Log::error('Erreur envoi 2FA: ' . $e->getMessage());
                }

                $payload = [
                    'message'      => 'Code OTP généré',
                    'user_id'      => $user->id_utilisateur,
                    'email'        => $user->email,
                    'requires_2fa' => true
                ];

                // En développement, renvoyer aussi le code dans la réponse pour faciliter les tests
                if (config('app.debug')) {
                    $payload['code'] = $user->two_factor_code;
                }

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
                'error'   => $e->getMessage()
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
            ]);

            // ✅ Récupération de l'utilisateur
            $user = Utilisateur::find($data['user_id']);

            if (!$user) {
                return response()->json([
                    'message' => 'Utilisateur introuvable'
                ], 404);
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

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors'  => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Erreur verify2FA: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la vérification',
                'error'   => $e->getMessage()
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
            ]);

            $user = Utilisateur::find($data['user_id']);

            if (!$user) {
                return response()->json([
                    'message' => 'Utilisateur introuvable'
                ], 404);
            }

            $user->generateTwoFactorCode();

            try {
                \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\TwoFactorCodeMail($user));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Erreur envoi resend2FA: ' . $e->getMessage());
            }

            $payload = ['message' => 'Nouveau code envoyé'];
            if (config('app.debug')) {
                $payload['code'] = $user->two_factor_code;
            }

            return response()->json($payload, 200);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage()
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
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage()
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

            if (!$user) {
                return response()->json([
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            // Charger les relations
            $user->load(['formations', 'produits', 'commandes', 'pays']);

            return response()->json([
                'id_utilisateur' => $user->id_utilisateur,
                'nom'            => $user->nom,
                'prenom'         => $user->prenom,
                'email'          => $user->email,
                'telephone'      => $user->telephone,
                'role'           => $user->role,
                'avatar'         => $user->avatar,
                'last_login'     => $user->last_login,
                'id_pays'        => $user->id_pays,
                'pays'           => $user->pays,
                'formations'     => $user->formations,   // ⚡ formations souscrites
                'produits'       => $user->produits,     // ⚡ produits achetés
                'commandes'      => $user->commandes,    // ⚡ commandes passées
            ]);
        } catch (\Throwable $e) {
            Log::error('Erreur profile: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🛠️ Mise à jour du profil.
     */
    public function updateProfile(Request $request)
    {
        try {
            $validated = $request->validate([
                'nom' => 'nullable|string',
                'prenom' => 'nullable|string',
                'telephone' => 'nullable|string',
                'email' => [
                    'nullable',
                    'email',
                    Rule::unique('utilisateurs', 'email')
                        ->ignore(auth()->id(), 'id_utilisateur')
                        ->whereNull('deleted_at')
                ],
                'mot_de_passe' => 'nullable|string|min:6|confirmed',
            ]);

            $user = auth()->user();
            $user->fill($validated);

            if (!empty($validated['mot_de_passe'])) {
                $user->mot_de_passe = Hash::make($validated['mot_de_passe']);
            }

            $user->save();

            return response()->json([
                'message' => 'Profil mis à jour',
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
     * 🔐 Changement de mot de passe.
     */
    public function changePassword(Request $request)
    {
        try {
            $data = $request->validate([
                'old' => 'required|string',
                'new' => 'required|string|min:6'
            ]);

            $user = auth()->user();

            if (!Hash::check($data['old'], $user->mot_de_passe)) {
                return response()->json([
                    'message' => 'Ancien mot de passe incorrect'
                ], 403);
            }

            $user->mot_de_passe = bcrypt($data['new']);
            $user->save();

            return response()->json([
                'message' => 'Mot de passe changé'
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🛠️ Liste des utilisateurs (admin).
     */
    public function index()
    {
        try {
            $utilisateurs = Utilisateur::whereNull('deleted_at')->get();
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
    public function show($id)
    {
        try {
            $user = Utilisateur::findOrFail($id);
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
                'role' => 'nullable|in:admin,client'
            ]);

            $user = Utilisateur::findOrFail($id);
            $user->update($validated);

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