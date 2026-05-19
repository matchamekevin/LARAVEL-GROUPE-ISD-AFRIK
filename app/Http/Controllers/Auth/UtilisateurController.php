<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\SendTwoFactorCodeJob;
use App\Mail\AccountAccessUpdatedMail;
use App\Mail\AccountReactivatedMail;
use App\Mail\AccountSuspendedMail;
use App\Mail\AdminCreatedMail;
use App\Mail\TwoFactorCodeMail;
use App\Models\Pays;
use App\Models\Utilisateur;
use App\Services\AuthService;
use App\Services\Base64ImageService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class UtilisateurController extends Controller
{
    protected AuthService $auth;

    public function __construct(AuthService $auth)
    {
        $this->auth = $auth;
    }

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

    private function buildAdminFlagsFromLevel(string $level): array
    {
        $normalized = $this->normalizeAdminRoleValue($level);

        if ($normalized === 'superadmin') {
            return [
                'is_admin' => true,
                'admin_role' => 'superadmin',
                'can_access_admin' => true,
            ];
        }

        if ($normalized === 'admin_pays') {
            return [
                'is_admin' => true,
                'admin_role' => 'admin_pays',
                'can_access_admin' => true,
            ];
        }

        if ($normalized === 'admin_adjoint') {
            return [
                'is_admin' => true,
                'admin_role' => 'admin_adjoint',
                'can_access_admin' => true,
            ];
        }

        return [
            'is_admin' => false,
            'admin_role' => 'client',
            'can_access_admin' => false,
        ];
    }

    private function deriveRequestedAdminLevel(array $validated, Utilisateur $user): string
    {
        if (
            array_key_exists('statut', $validated)
            && in_array((string) $validated['statut'], ['suspendu', 'inactif'], true)
        ) {
            return 'client';
        }

        $hasSuperAdminInput = array_key_exists('is_super_admin', $validated);
        $hasAdminPaysInput = array_key_exists('is_admin_pays', $validated);
        $hasAdminAdjointInput = array_key_exists('is_admin_adjoint', $validated);

        if ($hasSuperAdminInput || $hasAdminPaysInput || $hasAdminAdjointInput) {
            if ((bool) ($validated['is_super_admin'] ?? false)) {
                return 'superadmin';
            }

            if ((bool) ($validated['is_admin_pays'] ?? false)) {
                return 'admin_pays';
            }

            if ((bool) ($validated['is_admin_adjoint'] ?? false)) {
                return 'admin_adjoint';
            }

            return 'client';
        }

        if (array_key_exists('can_access_admin', $validated)) {
            if (! (bool) $validated['can_access_admin']) {
                return 'client';
            }

            return $this->resolveUserAdminLevel($user);
        }

        return $this->resolveUserAdminLevel($user);
    }

    private function hasAnotherSuperAdmin(?int $exceptUserId = null): bool
    {
        $query = Utilisateur::query()
            ->whereNull('deleted_at')
            ->where('is_admin', true)
            ->whereRaw("LOWER(COALESCE(admin_role, '')) = 'superadmin'");

        if ($exceptUserId !== null) {
            $query->where('id_utilisateur', '!=', $exceptUserId);
        }

        return $query->exists();
    }

    private function syncAccessPayload(array &$validated, Utilisateur $user, string $requestedAdminLevel): void
    {
        $flags = $this->buildAdminFlagsFromLevel($requestedAdminLevel);
        $validated['is_admin'] = $flags['is_admin'];
        $validated['admin_role'] = $flags['admin_role'];
        $validated['can_access_admin'] = $flags['can_access_admin'];

        if (
            $requestedAdminLevel === 'client'
            && ! array_key_exists('can_access_client', $validated)
            && ! (bool) $user->can_access_client
        ) {
            $validated['can_access_client'] = true;
        }

        if (
            array_key_exists('statut', $validated)
            && in_array((string) $validated['statut'], ['suspendu', 'inactif'], true)
        ) {
            $validated['can_access_client'] = false;
            $validated['is_admin'] = false;
            $validated['admin_role'] = 'client';
            $validated['can_access_admin'] = false;
        }
    }

    private function isSuperAdminUser(?object $user): bool
    {
        if (! $user) {
            return false;
        }

        return (bool) $user->is_admin
            && $this->normalizeAdminRoleValue($user->admin_role ?? null) === 'superadmin';
    }

    private function canActorManageUser(?object $actor, Utilisateur $target): bool
    {
        if (! $actor) {
            return false;
        }

        if ($this->isSuperAdminUser($actor)) {
            return true;
        }

        return ! $this->isSuperAdminUser($target);
    }

    private function portalAccessAllowed(Utilisateur $user, ?string $portal): bool
    {
        if ($user->statut !== 'actif') {
            return false;
        }

        $adminLevel = $this->resolveUserAdminLevel($user);
        $hasAdminAccess = in_array($adminLevel, ['admin_pays', 'admin_adjoint', 'superadmin'], true);

        if ($portal === 'admin') {
            return $hasAdminAccess;
        }

        if ($portal === 'client') {
            return (bool) $user->can_access_client;
        }

        return (bool) $user->can_access_client || $hasAdminAccess;
    }

    private function shouldPreserveCurrentAdminSession(Request $request, Utilisateur $target): bool
    {
        $actor = $request->user();
        if (! $actor) {
            return false;
        }

        if ((int) $actor->getAuthIdentifier() !== (int) $target->getAuthIdentifier()) {
            return false;
        }

        return $this->portalAccessAllowed($target, 'admin');
    }

    private function invalidateUserSessions(
        Utilisateur $user,
        ?Request $request = null,
        bool $preserveCurrentContext = false
    ): void {
        $preservedTokenId = null;
        $preservedSessionId = null;

        if ($preserveCurrentContext && $request && $request->user()) {
            $actor = $request->user();
            if ((int) $actor->getAuthIdentifier() === (int) $user->getAuthIdentifier()) {
                $preservedTokenId = $actor->currentAccessToken()?->id;
                if ($request->hasSession()) {
                    $preservedSessionId = $request->session()->getId();
                }
            }
        }

        $tokens = $user->tokens();
        if ($preservedTokenId !== null) {
            $tokens->where('id', '!=', $preservedTokenId);
        }
        $tokens->delete();

        $sessions = DB::table('sessions')
            ->where(function ($query) use ($user) {
                $query
                    ->where('user_id', (string) $user->getAuthIdentifier())
                    ->orWhere('user_id', $user->getAuthIdentifier());
            });

        if ($preservedSessionId) {
            $sessions->where('id', '!=', $preservedSessionId);
        }

        $sessions->delete();
    }

    private function dispatchTwoFactorCodeMail(Utilisateur $user, string $context = '2FA'): void
    {
        $forceSync = filter_var(config('mail.otp_force_sync', false), FILTER_VALIDATE_BOOL);

        try {
            if ($forceSync) {
                Mail::to($user->email)->send(new TwoFactorCodeMail($user));
                Log::info("OTP {$context} envoyé en synchrone (forcé)", [
                    'user_id' => $user->id_utilisateur,
                    'email' => $user->email,
                ]);
                return;
            }

            SendTwoFactorCodeJob::dispatch($user);
            Log::info("OTP {$context} mis en file d'attente", [
                'user_id' => $user->id_utilisateur,
                'email' => $user->email,
            ]);
        } catch (\Throwable $e) {
            Log::warning("Envoi OTP {$context} differe indisponible: ".$e->getMessage());

            try {
                Mail::to($user->email)->send(new TwoFactorCodeMail($user));
                Log::info("OTP {$context} envoyé en synchrone (fallback)", [
                    'user_id' => $user->id_utilisateur,
                    'email' => $user->email,
                ]);
            } catch (\Throwable $mailError) {
                Log::error("Envoi OTP {$context} fallback échoué: ".$mailError->getMessage());
            }
        }
    }

    private function buildAccessMailPayload(Utilisateur $before, Utilisateur $after): ?array
    {
        $roleBefore = $this->resolveUserAdminLevel($before);
        $roleAfter = $this->resolveUserAdminLevel($after);

        $removed = [];
        if ($before->can_access_client && ! $after->can_access_client) {
            $removed[] = "Acces a l'espace client";
        }
        if ($before->can_access_admin && ! $after->can_access_admin) {
            $removed[] = "Acces a l'espace administrateur";
        }
        if ($roleBefore !== $roleAfter) {
            $removed[] = 'Rôle précédent: '.$this->roleLabel($roleBefore);
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

        if (! $roleChanged && ! $accessChanged) {
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
        return match ($this->normalizeAdminRoleValue($role)) {
            'superadmin' => 'Super admin',
            'admin_adjoint' => 'Admin adjoint',
            default => 'Client',
        };
    }

    /**
     * Normalise et valide un numéro de téléphone selon l'indicatif du pays.
     * Retourne la forme E.164 (ex: +22890123456) ou null si invalide.
     */
    private function normalizeTelephoneForCountry(?string $telephone, ?int $id_pays): ?string
    {
        if (! $telephone) {
            return null;
        }

        // Ne garder que les chiffres
        $digits = preg_replace('/\D+/', '', $telephone);
        if (! $digits) {
            return null;
        }

        // Récupérer l'indicatif du pays (ex: +228)
        $countryCodeDigits = null;
        $pays = null;
        if ($id_pays) {
            $pays = Pays::find($id_pays);
        }
        if ($pays && ! empty($pays->code_pays)) {
            $countryCodeDigits = preg_replace('/\D+/', '', $pays->code_pays);
        }

        // Mappage d'attendus (principalement pays OUest-africains utilisés)
        $expectedLengths = [
            '225' => 8, // Cote d'Ivoire
            '226' => 8, // Burkina Faso
            '228' => 8, // Togo
            '229' => 8, // Benin
            '227' => 8, // Niger
        ];

        // Retirer préfixe international '00' si présent
        if (strpos($digits, '00') === 0) {
            $digits = substr($digits, 2);
        }

        if ($countryCodeDigits) {
            $expected = $expectedLengths[$countryCodeDigits] ?? 8;

            // Si le numéro commence par l'indicatif -> extraire la partie nationale
            if (strpos($digits, $countryCodeDigits) === 0) {
                $national = substr($digits, strlen($countryCodeDigits));
            } elseif (strlen($digits) === $expected + 1 && $digits[0] === '0') {
                // cas '0' préfixe local (ex: 090123456)
                $national = substr($digits, 1);
            } elseif (strlen($digits) === $expected) {
                $national = $digits;
            } else {
                return null;
            }

            if (strlen($national) !== $expected) {
                return null;
            }

            return '+'.$countryCodeDigits.$national;
        }

        // Si aucun pays trouvé, accepter un numéro général entre 8 et 15 chiffres
        if (strlen($digits) >= 8 && strlen($digits) <= 15) {
            return '+'.$digits;
        }

        return null;
    }

    private function generateTemporaryPassword(): string
    {
        return Str::upper(Str::random(4)).random_int(1000, 9999).'!';
    }

    private function verifyAndUpgradePassword(Utilisateur $user, string $plainPassword): bool
    {
        $storedPassword = (string) $user->mot_de_passe;

        if ($storedPassword === '') {
            Log::warning('Empty password stored for user: '.$user->email);

            return false;
        }

        // Test bcrypt hash (modern passwords)
        if (Hash::check($plainPassword, $storedPassword)) {
            if (Hash::needsRehash($storedPassword)) {
                Log::info('Rehashing password for user: '.$user->email);
                $user->mot_de_passe = $plainPassword;
                $user->save();
            }

            Log::info('Login successful (bcrypt verified): '.$user->email);

            return true;
        }

        // Test plaintext password (legacy migration)
        if (hash_equals($storedPassword, $plainPassword)) {
            Log::info('Login successful (plaintext, upgrading to hash): '.$user->email);
            $user->mot_de_passe = $plainPassword;
            $user->save();

            return true;
        }

        Log::warning('Failed password verification for user: '.$user->email);

        return false;
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

            // L'inscription publique crée toujours un compte client standard.
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
                    $this->dispatchTwoFactorCodeMail($user, 'inscription');
                }
            } catch (\Throwable $e) {
                // Ne pas bloquer l'inscription si génération/ envoi OTP échoue
                Log::error('Erreur génération/envoi OTP après inscription: '.$e->getMessage());
            }

            return response()->json([
                'message' => 'Inscription réussie',
                'user' => $user->load('pays'),
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'inscription',
                'errors' => $e->errors(),
            ], 422);
        } catch (QueryException $e) {
            // Gestion d'erreurs SQL spécifiques sans exposer les détails techniques
            $code = $e->getCode();
            if ($code == '23000') {
                return response()->json([
                    'message' => 'Erreur lors de l\'inscription',
                    'error' => 'Cet email est déjà utilisé.',
                ], 409);
            }

            // Not-null violation (Postgres 23502) — log and return friendly message
            if ($code == '23502') {
                Log::error('QueryException 23502 lors inscription: '.$e->getMessage());

                return response()->json([
                    'message' => 'Impossible de créer le compte pour le moment. Données manquantes ou format incorrect.',
                ], 400);
            }

            // Autres erreurs SQL — log et message générique
            Log::error('QueryException lors inscription: '.$e->getMessage());

            return response()->json([
                'message' => 'Erreur serveur lors de l\'inscription.',
            ], 500);
        } catch (\Throwable $e) {
            Log::error('Exception inattendue lors inscription: '.$e->getMessage());

            return response()->json([
                'message' => 'Erreur serveur. Veuillez réessayer plus tard.',
            ], 500);
        }
    }

    /**
     * 🔐 Connexion avec 2FA pour TOUS les utilisateurs.
     */
    public function login(Request $request)
    {
        try {
            // Compatibilité : certains clients envoient `password` au lieu de `mot_de_passe`.
            if (! $request->has('mot_de_passe') && $request->has('password')) {
                $request->merge(['mot_de_passe' => $request->input('password')]);
            }

            // ✅ Validation des credentials
            $credentials = $request->validate([
                'email' => 'required|email',
                'mot_de_passe' => 'required|string|min:6',
                'portal' => 'nullable|in:client,admin',
            ]);

            $normalizedEmail = Str::lower(trim((string) $credentials['email']));
            Log::debug('Login attempt for email: '.$normalizedEmail.', portal: '.($credentials['portal'] ?? 'none'));

            // ✅ Recherche de l'utilisateur (exclut les comptes supprimés)
            $user = Utilisateur::whereRaw('LOWER(email) = ?', [$normalizedEmail])
                ->whereNull('deleted_at')
                ->first();

            if (! $user) {
                Log::warning('Login failed: User not found for email: '.$normalizedEmail);

                return response()->json([
                    'message' => __('auth.failed'),
                ], 401);
            }

            if (! $this->verifyAndUpgradePassword($user, $credentials['mot_de_passe'])) {
                Log::warning('Login failed: Invalid password for user: '.$normalizedEmail);

                return response()->json([
                    'message' => __('auth.failed'),
                ], 401);
            }

            $portal = $credentials['portal'] ?? null;

            if (! $this->portalAccessAllowed($user, $portal)) {
                $reason = $portal === 'admin' ? 'Admin access denied' : 'Account inactive';
                Log::warning('Login failed: Portal access denied for user: '.$normalizedEmail.' ('.$reason.')');

                return response()->json([
                    'message' => $portal === 'admin' ? 'Accès admin refusé' : 'Compte désactivé',
                ], 403);
            }

            // 🔐 Si 2FA est activé
            if ($user->two_factor_enabled ?? false) {
                Log::info('[LOGIN] 🔐 2FA requis pour user: '.$normalizedEmail);
                // Génération du code OTP
                $user->generateTwoFactorCode();
                Log::debug('[LOGIN] 📧 Code OTP généré: '.$user->two_factor_code.' | Expires: '.$user->two_factor_expires_at);

                $this->dispatchTwoFactorCodeMail($user, 'login');
                Log::info('[LOGIN] 📨 Email OTP envoyé à: '.$user->email);

                $payload = [
                    'message' => 'Code OTP généré et envoyé',
                    'user_id' => $user->id_utilisateur,
                    'email' => $user->email,
                    'requires_2fa' => true,
                    'portal' => $portal,
                ];

                Log::info('[LOGIN] 📤 Réponse 2FA: '.json_encode($payload));

                return response()->json($payload, 200);
            }

            // ✅ Connexion classique sans 2FA
            $token = $user->createToken('auth_token')->plainTextToken;
            Log::info('[LOGIN] 🔑 Token généré pour user: '.$normalizedEmail.' | Token prefix: '.substr($token, 0, 20).'...');
            Log::debug('[LOGIN] 📊 User data: ID='.$user->id_utilisateur.', can_access_client='.$user->can_access_client.', statut='.$user->statut);
            Log::info('[LOGIN] ✅ Connexion réussie pour: '.$normalizedEmail);

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
            Log::warning('Login validation error: '.json_encode($e->errors()));

            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('[LOGIN] ❌ Exception: '.get_class($e).' | '.$e->getMessage().' | '.$e->getFile().':'.$e->getLine());
            Log::error('[LOGIN] 📋 Stack trace: '.$e->getTraceAsString());

            $payload = ['message' => 'Erreur lors de la connexion'];
            if (config('app.debug')) {
                $payload['error'] = $e->getMessage();
                $payload['class'] = get_class($e);
                $payload['file'] = $e->getFile().':'.$e->getLine();
            } else {
                $payload['error'] = get_class($e).': '.$e->getMessage();
                $payload['file'] = $e->getFile().':'.$e->getLine();
            }

            return response()->json($payload, 500);
        }
    }

    /**
     * 🔐 Vérification du code 2FA.
     */
    public function verify2FA(Request $request)
    {
        try {
            Log::info('[2FA] 🔐 Tentative de vérification 2FA');

            // ✅ Validation des données
            $data = $request->validate([
                'user_id' => 'required|integer|exists:utilisateurs,id_utilisateur',
                'code' => 'required|string|size:6',
                'portal' => 'nullable|in:client,admin',
            ]);

            Log::debug('[2FA] 📋 Données reçues: user_id='.$data['user_id'].', code='.$data['code'].', portal='.$data['portal']);

            // ✅ Récupération de l'utilisateur
            $user = Utilisateur::find($data['user_id']);

            if (! $user) {
                Log::warning('[2FA] ❌ Utilisateur non trouvé: '.$data['user_id']);

                return response()->json([
                    'message' => 'Utilisateur introuvable',
                ], 404);
            }

            Log::debug('[2FA] 👤 Utilisateur trouvé: '.$user->email);

            if (! $this->portalAccessAllowed($user, $data['portal'] ?? null)) {
                Log::warning('[2FA] ❌ Accès portail refusé pour: '.$user->email.' | portal='.$data['portal']);

                return response()->json([
                    'message' => ($data['portal'] ?? null) === 'admin' ? 'Accès admin refusé' : 'Compte désactivé',
                ], 403);
            }

            // 🔐 Vérification du code OTP
            Log::debug('[2FA] 🔍 Vérification code: reçu='.$data['code'].' | en_base='.$user->two_factor_code);

            if ($user->two_factor_code !== $data['code']) {
                Log::warning('[2FA] ❌ Code invalide pour: '.$user->email);

                return response()->json([
                    'message' => 'Code invalide',
                ], 403);
            }

            // 🔐 Vérification de l'expiration
            if (! $user->two_factor_expires_at || now()->greaterThan($user->two_factor_expires_at)) {
                Log::warning('[2FA] ❌ Code expiré pour: '.$user->email.' | expires_at='.$user->two_factor_expires_at);

                return response()->json([
                    'message' => 'Code expiré',
                ], 403);
            }

            Log::info('[2FA] ✅ Code valide pour: '.$user->email);

            // ✅ Réinitialiser le code OTP
            $user->resetTwoFactorCode();
            Log::debug('[2FA] 🔄 Code OTP réinitialisé');

            // ✅ Mettre à jour la dernière connexion
            $user->last_login = now();
            $user->save();

            // 🔑 Générer un token Sanctum
            $token = $user->createToken('auth_token')->plainTextToken;
            Log::info('[2FA] 🔑 Token généré pour: '.$user->email.' | Token prefix: '.substr($token, 0, 20).'...');

            $response = [
                'message' => 'Connexion réussie',
                'user' => $user->load('pays'),
                'role' => $this->resolveUserAdminLevel($user),
                'admin_level' => $this->resolveUserAdminLevel($user),
                'is_super_admin' => $this->resolveUserAdminLevel($user) === 'superadmin',
                'is_admin_adjoint' => $this->resolveUserAdminLevel($user) === 'admin_adjoint',
                'token' => $token,
                'requires_2fa' => false,
            ];

            Log::info('[2FA] ✅ Connexion 2FA complète pour: '.$user->email);

            return response()->json($response, 200);

        } catch (ValidationException $e) {
            Log::warning('[2FA] ❌ Erreur validation: '.json_encode($e->errors()));

            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('[2FA] ❌ Erreur: '.$e->getMessage().' | '.$e->getFile().':'.$e->getLine());

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
            Log::info('[2FA] 📨 Demande de renvoi du code OTP');

            $data = $request->validate([
                'user_id' => 'required|integer|exists:utilisateurs,id_utilisateur',
                'portal' => 'nullable|in:client,admin',
            ]);

            Log::debug('[2FA] 📋 Données reçues: user_id='.$data['user_id'].', portal='.$data['portal']);

            $user = Utilisateur::find($data['user_id']);

            if (! $user) {
                Log::warning('[2FA] ❌ Utilisateur non trouvé: '.$data['user_id']);

                return response()->json([
                    'message' => 'Utilisateur introuvable',
                ], 404);
            }

            Log::debug('[2FA] 👤 Utilisateur trouvé: '.$user->email);

            if (! $this->portalAccessAllowed($user, $data['portal'] ?? null)) {
                Log::warning('[2FA] ❌ Accès portail refusé pour: '.$user->email);

                return response()->json([
                    'message' => ($data['portal'] ?? null) === 'admin' ? 'Accès admin refusé' : 'Compte désactivé',
                ], 403);
            }

            $user->generateTwoFactorCode();
            Log::debug('[2FA] ✅ Code OTP généré: '.$user->two_factor_code.' | Expires: '.$user->two_factor_expires_at);

            $this->dispatchTwoFactorCodeMail($user, 'resend');
            Log::info('[2FA] 📧 Email renvoyé à: '.$user->email);

            return response()->json(['message' => 'Nouveau code envoyé'], 200);

        } catch (\Throwable $e) {
            Log::error('[2FA] ❌ Erreur resend2FA: '.$e->getMessage().' | '.$e->getFile().':'.$e->getLine());

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
                'message' => 'Déconnexion réussie',
            ]);
        } catch (\Throwable $e) {
            Log::error('Erreur logout: '.$e->getMessage());

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
            $userId = $user?->id_utilisateur ?? 'unknown';
            $token = $request->bearerToken();

            Log::debug('[PROFILE] 📋 Requête profile reçue | User ID='.$userId.' | Portal='.$portal.' | Token prefix: '.substr($token ?? '', 0, 20).'...');

            if (! $user) {
                Log::warning('[PROFILE] ❌ Utilisateur non authentifié');

                return response()->json([
                    'message' => 'Utilisateur non authentifié',
                ], 401);
            }

            if (! $this->portalAccessAllowed($user, $portal)) {
                Log::warning('[PROFILE] ❌ Accès refusé | User ID='.$userId.' | Portal='.$portal.' | Statut='.$user->statut.' | can_access_client='.$user->can_access_client);

                // ⚠️ NE PAS supprimer le token ! C'est le frontend qui décide
                return response()->json([
                    'message' => $portal === 'admin' ? 'Accès admin refusé' : 'Compte désactivé',
                ], 403);
            }

            $adminLevel = $this->resolveUserAdminLevel($user);

            Log::debug('[PROFILE] ✅ Profil autorisé | User ID='.$userId.' | Admin level='.$adminLevel);

            // Charger les relations
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
                'formations' => $user->formations,   // ⚡ formations souscrites
                'produits' => $user->produits,     // ⚡ produits achetés
                'commandes' => $user->commandes,    // ⚡ commandes passées
            ]);
        } catch (\Throwable $e) {
            Log::error('[PROFILE] ❌ Erreur: '.$e->getMessage().' | '.$e->getFile().':'.$e->getLine());

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
            if (! $user) {
                return response()->json([
                    'message' => 'Utilisateur non authentifie',
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
                        ->whereNull('deleted_at'),
                ],
            ]);

            $user->fill($validated);

            $user->save();

            return response()->json([
                'message' => 'Profil mis à jour',
                'utilisateur' => $user,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Erreur updateProfile: '.$e->getMessage());

            return response()->json([
                'message' => 'Erreur serveur',
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
            if (! $user) {
                return response()->json([
                    'message' => 'Utilisateur non authentifie',
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

            if (! $oldPassword || ! $newPassword || ! Hash::check($oldPassword, $user->mot_de_passe)) {
                return response()->json([
                    'message' => 'Ancien mot de passe incorrect',
                ], 403);
            }

            if (Hash::check($newPassword, $user->mot_de_passe)) {
                return response()->json([
                    'message' => 'Le nouveau mot de passe doit etre different de l\'ancien',
                ], 422);
            }

            $user->mot_de_passe = $newPassword;
            $user->save();

            return response()->json([
                'message' => 'Mot de passe changé',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Erreur changePassword: '.$e->getMessage());

            return response()->json([
                'message' => 'Erreur serveur',
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
            $perPage = max(1, min(50, (int) $request->query('per_page', 20)));
            $page = max(1, (int) $request->query('page', 1));
            $search = trim((string) $request->query('q', ''));
            $isAdminFilter = $request->query('is_admin');
            $statusFilter = $request->query('statut');

            $query = Utilisateur::query()
                ->select([
                    'id_utilisateur',
                    'nom',
                    'prenom',
                    'email',
                    'telephone',
                    'is_admin',
                    'statut',
                    'can_access_client',
                    'can_access_admin',
                    'admin_role',
                    'id_pays',
                ])
                ->whereNull('deleted_at');

            if ($isAdminFilter !== null && $isAdminFilter !== '') {
                $query->where('is_admin', filter_var($isAdminFilter, FILTER_VALIDATE_BOOLEAN));
            }

            if ($statusFilter !== null && $statusFilter !== '') {
                $query->where('statut', $statusFilter);
            }

            if (! $this->isSuperAdminUser($actor)) {
                $query->where(function ($builder) {
                    $builder
                        ->whereNull('admin_role')
                        ->orWhereRaw("LOWER(admin_role) != 'superadmin'");
                });
            }

            if ($search !== '') {
                $term = '%'.$search.'%';
                $query->where(function ($builder) use ($term) {
                    $builder
                        ->where('nom', 'ILIKE', $term)
                        ->orWhere('prenom', 'ILIKE', $term)
                        ->orWhere('email', 'ILIKE', $term)
                        ->orWhere('telephone', 'ILIKE', $term);
                });
            }

            $statsQuery = clone $query;

            $utilisateurs = $query
                ->orderBy('id_utilisateur')
                ->paginate($perPage, ['*'], 'page', $page)
                ->appends($request->query());

            $items = collect($utilisateurs->items())
                ->map(function ($item) {
                    $level = $this->resolveUserAdminLevel($item);
                    $item->role = $level;
                    $item->admin_level = $level;
                    $item->is_super_admin = $level === 'superadmin';
                    $item->is_admin_adjoint = $level === 'admin_adjoint';

                    return $item;
                })
                ->values();

            return response()->json([
                'data' => $items,
                'meta' => [
                    'total' => $utilisateurs->total(),
                    'per_page' => $utilisateurs->perPage(),
                    'current_page' => $utilisateurs->currentPage(),
                    'last_page' => $utilisateurs->lastPage(),
                    'from' => $utilisateurs->firstItem(),
                    'to' => $utilisateurs->lastItem(),
                ],
                'stats' => [
                    'total' => $statsQuery->count(),
                    'active' => (clone $statsQuery)->where('statut', 'actif')->count(),
                    'suspended' => (clone $statsQuery)->where('statut', 'suspendu')->count(),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage(),
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
            if (! $this->canActorManageUser($request->user(), $user)) {
                return response()->json([
                    'message' => 'Accès refusé à ce compte.',
                ], 403);
            }
            $level = $this->resolveUserAdminLevel($user);

            return response()->json([
                ...$user->toArray(),
                'role' => $level,
                'admin_level' => $level,
                'is_super_admin' => $level === 'superadmin',
                'is_admin_adjoint' => $level === 'admin_adjoint',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Utilisateur introuvable',
                'error' => $e->getMessage(),
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
                        ->whereNull('deleted_at'),
                ],
                'telephone' => 'nullable|string',
                'statut' => 'nullable|in:actif,inactif,suspendu',
                'can_access_client' => 'nullable|boolean',
                'can_access_admin' => 'nullable|boolean',
                'is_super_admin' => 'nullable|boolean',
                'is_admin_pays' => 'nullable|boolean',
                'is_admin_adjoint' => 'nullable|boolean',
            ]);

            $user = Utilisateur::findOrFail($id);
            $actor = $request->user();

            if (! $this->canActorManageUser($actor, $user)) {
                return response()->json([
                    'message' => 'Action interdite: un admin adjoint ne peut pas gérer un super admin.',
                ], 403);
            }

            $requestedAdminLevel = $this->deriveRequestedAdminLevel($validated, $user);

            if ($requestedAdminLevel === 'superadmin' && ! $this->isSuperAdminUser($actor)) {
                return response()->json([
                    'message' => 'Seul un super admin peut attribuer ce niveau.',
                ], 403);
            }

            if ($requestedAdminLevel === 'superadmin' && $this->hasAnotherSuperAdmin((int) $user->id_utilisateur)) {
                return response()->json([
                    'message' => 'Un seul super admin est autorisé.',
                ], 422);
            }

            if (
                $this->isSuperAdminUser($user)
                && $requestedAdminLevel !== 'superadmin'
                && ! $this->hasAnotherSuperAdmin((int) $user->id_utilisateur)
            ) {
                return response()->json([
                    'message' => 'Impossible de retirer le seul super admin existant.',
                ], 422);
            }

            $before = $user->replicate();

            $this->syncAccessPayload($validated, $user, $requestedAdminLevel);

            unset($validated['is_super_admin'], $validated['is_admin_pays'], $validated['is_admin_adjoint']);

            $user->update($validated);
            $user->refresh();

            $statusChanged = (string) $before->statut !== (string) $user->statut;
            $roleChanged = $this->resolveUserAdminLevel($before)
                !== $this->resolveUserAdminLevel($user);
            $accessChanged = (bool) $before->can_access_client !== (bool) $user->can_access_client
                || (bool) $before->can_access_admin !== (bool) $user->can_access_admin;

            if ($roleChanged || $accessChanged || $statusChanged) {
                $this->invalidateUserSessions(
                    $user,
                    $request,
                    $this->shouldPreserveCurrentAdminSession($request, $user)
                );
            }

            if ($statusChanged) {
                if ($user->statut === 'suspendu') {
                    try {
                        Mail::to($user->email)->send(new AccountSuspendedMail($user));
                    } catch (\Throwable $e) {
                        Log::warning('Erreur envoi email suspension: '.$e->getMessage());
                    }
                } elseif ($user->statut === 'actif' && $before->statut === 'suspendu') {
                    try {
                        Mail::to($user->email)->send(new AccountReactivatedMail($user));
                    } catch (\Throwable $e) {
                        Log::warning('Erreur envoi email réactivation: '.$e->getMessage());
                    }
                }
            }

            $mailPayload = $this->buildAccessMailPayload($before, $user);
            if ($mailPayload) {
                try {
                    Mail::to($user->email)->send(new AccountAccessUpdatedMail($user, $mailPayload));
                } catch (\Throwable $e) {
                    Log::warning('Erreur envoi email role/acces: '.$e->getMessage());
                }
            }

            return response()->json([
                'message' => 'Utilisateur mis à jour',
                'utilisateur' => $user,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage(),
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

            if (! $this->canActorManageUser($actor, $user)) {
                return response()->json([
                    'message' => 'Action interdite: un admin adjoint ne peut pas supprimer un super admin.',
                ], 403);
            }

            $this->invalidateUserSessions($user);
            $user->delete();

            return response()->json([
                'message' => 'Utilisateur supprimé',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage(),
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
                'message' => 'Compte supprimé',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage(),
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
            if (! $this->canActorManageUser(auth()->user(), $user)) {
                return response()->json([
                    'message' => 'Action interdite: un admin adjoint ne peut pas restaurer un super admin.',
                ], 403);
            }

            if (! $user->trashed()) {
                return response()->json([
                    'message' => 'Compte déjà actif',
                ], 400);
            }

            $user->restore();

            return response()->json([
                'message' => 'Utilisateur restauré',
                'utilisateur' => $user,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function storeAdminAdjoint(Request $request)
    {
        $actor = $request->user();

        if (! $this->isSuperAdminUser($actor)) {
            return response()->json([
                'message' => 'Accès réservé au super administrateur.',
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
                'admin_role' => 'nullable|string|in:admin_adjoint,admin_pays,admin_national',
                'can_access_client' => 'nullable|boolean',
                'two_factor_enabled' => 'nullable|boolean',
            ]);

            // Normaliser et valider le numéro selon le pays sélectionné
            $idPays = $validated['id_pays'] ?? $actor->id_pays ?? null;
            $normalizedPhone = null;
            if (! empty($validated['telephone'])) {
                $normalizedPhone = $this->normalizeTelephoneForCountry($validated['telephone'], $idPays);
                if ($normalizedPhone === null) {
                    return response()->json([
                        'message' => 'Erreur de validation',
                        'errors' => [
                            'telephone' => ['Numéro de téléphone invalide pour le pays sélectionné.'],
                        ],
                    ], 422);
                }
            }

            $requestedRole = $this->normalizeAdminRoleValue($validated['admin_role'] ?? 'admin_adjoint');

            $password = $this->generateTemporaryPassword();
            $admin = Utilisateur::create([
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $validated['email'],
                'telephone' => $normalizedPhone ?? ($validated['telephone'] ?? null),
                'mot_de_passe' => $password,
                'admin_role' => $requestedRole,
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
                Log::warning('Erreur envoi email creation admin adjoint: '.$e->getMessage());
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
            Log::error('Erreur creation admin adjoint: '.$e->getMessage());

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
                'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
            ]);

            $encoded = Base64ImageService::encode($request->file('avatar'));

            $user = $request->user();
            $user->avatar_data = $encoded['data'];
            $user->avatar_mime = $encoded['mime'];
            $user->avatar = null; // clear legacy path
            $user->save();

            return response()->json([
                'message' => 'Avatar mis à jour',
                'avatar_url' => $user->avatar_url,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 🖼️ Servir l'avatar d'un utilisateur.
     */
    public function avatarImage($id)
    {
        $user = Utilisateur::find($id);
        if (!$user) {
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
