<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\SendTwoFactorCodeJob;
use App\Mail\TwoFactorCodeMail;
use App\Models\Utilisateur;
use App\Services\AuthService;
use App\Traits\UserManagementHelpers;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use UserManagementHelpers;

    protected AuthService $auth;

    public function __construct(AuthService $auth)
    {
        $this->auth = $auth;
    }

    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'nom' => 'required|string|max:100',
                'prenom' => 'required|string|max:100',
                'email' => [
                    'required',
                    'email',
                    Rule::unique('utilisateurs', 'email')->whereNull('deleted_at'),
                ],
                'telephone' => 'required|string|max:20',
                'mot_de_passe' => 'required|string|min:6',
                'mot_de_passe_confirmation' => 'nullable|same:mot_de_passe',
                'id_pays' => 'required|exists:pays,id_pays',
                'two_factor_enabled' => 'nullable|boolean',
            ], [
                'email.unique' => 'Cet email est déjà utilisé par un autre compte actif.',
                'id_pays.required' => 'Le pays est obligatoire.',
                'id_pays.exists' => "Le pays sélectionné n'existe pas.",
            ]);

            $validated['is_admin'] = false;
            $validated['admin_role'] = 'client';
            $validated['statut'] = 'actif';
            $validated['can_access_client'] = true;
            $validated['can_access_admin'] = false;

            $user = Utilisateur::create($validated);

            try {
                if ($user->two_factor_enabled) {
                    $user->generateTwoFactorCode();
                    $this->dispatchTwoFactorCodeMail($user, 'inscription');
                }
            } catch (\Throwable $e) {
                Log::error('Erreur génération/envoi OTP après inscription: '.$e->getMessage());
            }

            return response()->json([
                'message' => 'Inscription réussie',
                'user' => $user->load('pays'),
            ], 201);

        } catch (ValidationException $e) {
            return response()->json(['message' => 'Erreur lors de l\'inscription', 'errors' => $e->errors()], 422);
        } catch (QueryException $e) {
            $code = $e->getCode();
            if ($code == '23000') {
                return response()->json(['message' => 'Erreur lors de l\'inscription', 'error' => 'Cet email est déjà utilisé.'], 409);
            }
            if ($code == '23502') {
                Log::error('QueryException 23502 lors inscription: '.$e->getMessage());

                return response()->json(['message' => 'Impossible de créer le compte pour le moment. Données manquantes ou format incorrect.'], 400);
            }
            Log::error('QueryException lors inscription: '.$e->getMessage());

            return response()->json(['message' => 'Erreur serveur lors de l\'inscription.'], 500);
        } catch (\Throwable $e) {
            Log::error('Exception inattendue lors inscription: '.$e->getMessage());

            return response()->json(['message' => 'Erreur serveur. Veuillez réessayer plus tard.'], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            if (! $request->has('mot_de_passe') && $request->has('password')) {
                $request->merge(['mot_de_passe' => $request->input('password')]);
            }

            $credentials = $request->validate([
                'email' => 'required|email',
                'mot_de_passe' => 'required|string|min:6',
                'portal' => 'nullable|in:client,admin',
            ]);

            $normalizedEmail = Str::lower(trim($credentials['email']));
            Log::debug('Login attempt for email: '.$normalizedEmail.', portal: '.($credentials['portal'] ?? 'none'));

            $user = Utilisateur::whereRaw('LOWER(email) = ?', [$normalizedEmail])
                ->whereNull('deleted_at')
                ->first();

            if (! $user) {
                Log::warning('Login failed: User not found for email: '.$normalizedEmail);

                return response()->json(['message' => __('auth.failed')], 401);
            }

            if (! $this->verifyAndUpgradePassword($user, $credentials['mot_de_passe'])) {
                Log::warning('Login failed: Invalid password for user: '.$normalizedEmail);

                return response()->json(['message' => __('auth.failed')], 401);
            }

            $portal = $credentials['portal'] ?? null;

            if (! $this->portalAccessAllowed($user, $portal)) {
                $reason = $portal === 'admin' ? 'Admin access denied' : 'Account inactive';
                Log::warning('Login failed: Portal access denied for user: '.$normalizedEmail.' ('.$reason.')');

                return response()->json([
                    'message' => $portal === 'admin' ? 'Accès admin refusé' : 'Compte désactivé',
                ], 403);
            }

            if ($user->two_factor_enabled ?? false) {
                Log::info('[LOGIN] 2FA requis pour user: '.$normalizedEmail);
                $user->generateTwoFactorCode();
                $this->dispatchTwoFactorCodeMail($user, 'login');

                return response()->json([
                    'message' => 'Code OTP généré et envoyé',
                    'user_id' => $user->id_utilisateur,
                    'email' => $user->email,
                    'requires_2fa' => true,
                    'portal' => $portal,
                ], 200);
            }

            $token = $user->createToken('auth_token')->plainTextToken;
            Log::info('[LOGIN] Connexion réussie pour: '.$normalizedEmail);

            return response()->json([
                'message' => 'Connexion réussie',
                'token' => $token,
                'user' => $user->load('pays'),
                'role' => $this->resolveUserAdminLevel($user),
                'admin_level' => $this->resolveUserAdminLevel($user),
                'is_super_admin' => $this->resolveUserAdminLevel($user) === 'superadmin',
                'is_admin_adjoint' => $this->resolveUserAdminLevel($user) === 'admin_adjoint',
                'requires_2fa' => false,
            ], 200);

        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Throwable $e) {
            Log::error('[LOGIN] Exception: '.get_class($e).' | '.$e->getMessage().' | '.$e->getFile().':'.$e->getLine());
            $payload = ['message' => 'Erreur lors de la connexion'];
            if (config('app.debug')) {
                $payload['error'] = $e->getMessage();
                $payload['class'] = get_class($e);
                $payload['file'] = $e->getFile().':'.$e->getLine();
            }

            return response()->json($payload, 500);
        }
    }

    public function verify2FA(Request $request)
    {
        try {
            $data = $request->validate([
                'user_id' => 'required|string|exists:utilisateurs,id_utilisateur',
                'code' => 'required|string|size:6',
                'portal' => 'nullable|in:client,admin',
            ]);

            $user = Utilisateur::find($data['user_id']);

            if (! $user) {
                return response()->json(['message' => 'Utilisateur introuvable'], 404);
            }

            if (! $this->portalAccessAllowed($user, $data['portal'] ?? null)) {
                return response()->json([
                    'message' => ($data['portal'] ?? null) === 'admin' ? 'Accès admin refusé' : 'Compte désactivé',
                ], 403);
            }

            if ($user->two_factor_code !== $data['code']) {
                return response()->json(['message' => 'Code invalide'], 403);
            }

            if (! $user->two_factor_expires_at || now()->greaterThan($user->two_factor_expires_at)) {
                return response()->json(['message' => 'Code expiré'], 403);
            }

            $user->resetTwoFactorCode();
            $user->last_login = now();
            $user->save();

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Connexion réussie',
                'user' => $user->load('pays'),
                'role' => $this->resolveUserAdminLevel($user),
                'admin_level' => $this->resolveUserAdminLevel($user),
                'is_super_admin' => $this->resolveUserAdminLevel($user) === 'superadmin',
                'is_admin_adjoint' => $this->resolveUserAdminLevel($user) === 'admin_adjoint',
                'token' => $token,
                'requires_2fa' => false,
            ]);

        } catch (ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Throwable $e) {
            Log::error('[2FA] Erreur: '.$e->getMessage());

            return response()->json(['message' => 'Erreur lors de la vérification'], 500);
        }
    }

    public function resend2FACode(Request $request)
    {
        try {
            $data = $request->validate([
                'user_id' => 'required|string|exists:utilisateurs,id_utilisateur',
                'portal' => 'nullable|in:client,admin',
            ]);

            $user = Utilisateur::find($data['user_id']);

            if (! $user) {
                return response()->json(['message' => 'Utilisateur introuvable'], 404);
            }

            if (! $this->portalAccessAllowed($user, $data['portal'] ?? null)) {
                return response()->json([
                    'message' => ($data['portal'] ?? null) === 'admin' ? 'Accès admin refusé' : 'Compte désactivé',
                ], 403);
            }

            $user->generateTwoFactorCode();
            $this->dispatchTwoFactorCodeMail($user, 'resend');

            return response()->json(['message' => 'Nouveau code envoyé']);
        } catch (\Throwable $e) {
            Log::error('[2FA] Erreur resend: '.$e->getMessage());

            return response()->json(['message' => 'Erreur lors du renvoi du code'], 500);
        }
    }

    public function logout()
    {
        try {
            $this->auth->logout();

            return response()->json(['message' => 'Déconnexion réussie']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur lors de la déconnexion'], 500);
        }
    }

    private function verifyAndUpgradePassword(Utilisateur $user, string $plainPassword): bool
    {
        $storedPassword = (string) $user->mot_de_passe;

        if ($storedPassword === '') {
            Log::warning('Empty password stored for user: '.$user->email);

            return false;
        }

        if (Hash::check($plainPassword, $storedPassword)) {
            if (Hash::needsRehash($storedPassword)) {
                Log::info('Rehashing password for user: '.$user->email);
                $user->mot_de_passe = $plainPassword;
                $user->save();
            }

            return true;
        }

        if (hash_equals($storedPassword, $plainPassword)) {
            Log::info('Login successful (plaintext, upgrading to hash): '.$user->email);
            $user->mot_de_passe = $plainPassword;
            $user->save();

            return true;
        }

        return false;
    }

    private function dispatchTwoFactorCodeMail(Utilisateur $user, string $context = '2FA'): void
    {
        $forceSync = filter_var(config('mail.otp_force_sync', false), FILTER_VALIDATE_BOOL);

        try {
            if ($forceSync) {
                Mail::to($user->email)->send(new TwoFactorCodeMail($user));

                return;
            }
            SendTwoFactorCodeJob::dispatch($user);
        } catch (\Throwable $e) {
            try {
                Mail::to($user->email)->send(new TwoFactorCodeMail($user));
            } catch (\Throwable $mailError) {
                Log::error('Envoi OTP fallback échoué: '.$mailError->getMessage());
            }
        }
    }
}
