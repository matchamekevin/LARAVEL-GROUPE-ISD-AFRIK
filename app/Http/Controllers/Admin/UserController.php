<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AccountAccessUpdatedMail;
use App\Mail\AccountReactivatedMail;
use App\Mail\AccountSuspendedMail;
use App\Mail\AdminCreatedMail;
use App\Models\Pays;
use App\Models\Utilisateur;
use App\Traits\UserManagementHelpers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    use UserManagementHelpers;

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
                    'id_utilisateur', 'nom', 'prenom', 'email', 'telephone',
                    'is_admin', 'statut', 'can_access_client', 'can_access_admin',
                    'admin_role', 'id_pays',
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
            return response()->json(['message' => 'Erreur', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $user = Utilisateur::findOrFail($id);
            if (! $this->canActorManageUser($request->user(), $user)) {
                return response()->json(['message' => 'Accès refusé à ce compte.'], 403);
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
            return response()->json(['message' => 'Utilisateur introuvable', 'error' => $e->getMessage()], 404);
        }
    }

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
                return response()->json(['message' => 'Action interdite: un admin adjoint ne peut pas gérer un super admin.'], 403);
            }

            $requestedAdminLevel = $this->deriveRequestedAdminLevel($validated, $user);

            if ($requestedAdminLevel === 'superadmin' && ! $this->isSuperAdminUser($actor)) {
                return response()->json(['message' => 'Seul un super admin peut attribuer ce niveau.'], 403);
            }

            if ($requestedAdminLevel === 'superadmin' && $this->hasAnotherSuperAdmin($user->id_utilisateur)) {
                return response()->json(['message' => 'Un seul super admin est autorisé.'], 422);
            }

            if ($this->isSuperAdminUser($user) && $requestedAdminLevel !== 'superadmin' && ! $this->hasAnotherSuperAdmin($user->id_utilisateur)) {
                return response()->json(['message' => 'Impossible de retirer le seul super admin existant.'], 422);
            }

            $before = $user->replicate();
            $this->syncAccessPayload($validated, $user, $requestedAdminLevel);

            unset($validated['is_super_admin'], $validated['is_admin_pays'], $validated['is_admin_adjoint']);

            $user->update($validated);
            $user->refresh();

            $statusChanged = (string) $before->statut !== (string) $user->statut;
            $roleChanged = $this->resolveUserAdminLevel($before) !== $this->resolveUserAdminLevel($user);
            $accessChanged = (bool) $before->can_access_client !== (bool) $user->can_access_client
                || (bool) $before->can_access_admin !== (bool) $user->can_access_admin;

            if ($roleChanged || $accessChanged || $statusChanged) {
                $this->invalidateUserSessions($user, $request, $this->shouldPreserveCurrentAdminSession($request, $user));
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

            return response()->json(['message' => 'Utilisateur mis à jour', 'utilisateur' => $user]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = Utilisateur::findOrFail($id);
            $actor = auth()->user();

            if (! $this->canActorManageUser($actor, $user)) {
                return response()->json(['message' => 'Action interdite: un admin adjoint ne peut pas supprimer un super admin.'], 403);
            }

            $this->invalidateUserSessions($user);
            $user->delete();

            return response()->json(['message' => 'Utilisateur supprimé']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur', 'error' => $e->getMessage()], 500);
        }
    }

    public function restore($id)
    {
        try {
            $user = Utilisateur::withTrashed()->findOrFail($id);
            if (! $this->canActorManageUser(auth()->user(), $user)) {
                return response()->json(['message' => 'Action interdite: un admin adjoint ne peut pas restaurer un super admin.'], 403);
            }

            if (! $user->trashed()) {
                return response()->json(['message' => 'Compte déjà actif'], 400);
            }

            $user->restore();

            return response()->json(['message' => 'Utilisateur restauré', 'utilisateur' => $user]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur', 'error' => $e->getMessage()], 500);
        }
    }

    public function storeAdminAdjoint(Request $request)
    {
        $actor = $request->user();

        if (! $this->isSuperAdminUser($actor)) {
            return response()->json(['message' => 'Accès réservé au super administrateur.'], 403);
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

            $idPays = $validated['id_pays'] ?? $actor->id_pays ?? null;
            $normalizedPhone = null;
            if (! empty($validated['telephone'])) {
                $normalizedPhone = $this->normalizeTelephoneForCountry($validated['telephone'], $idPays);
                if ($normalizedPhone === null) {
                    return response()->json([
                        'message' => 'Erreur de validation',
                        'errors' => ['telephone' => ['Numéro de téléphone invalide pour le pays sélectionné.']],
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

            return response()->json(['message' => 'Compte admin adjoint créé avec succès.', 'utilisateur' => $admin->load('pays')], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur lors de la création du compte admin adjoint.'], 500);
        }
    }

    private function buildAdminFlagsFromLevel(string $level): array
    {
        $normalized = $this->normalizeAdminRoleValue($level);

        return match ($normalized) {
            'superadmin' => ['is_admin' => true, 'admin_role' => 'superadmin', 'can_access_admin' => true],
            'admin_pays' => ['is_admin' => true, 'admin_role' => 'admin_pays', 'can_access_admin' => true],
            'admin_adjoint' => ['is_admin' => true, 'admin_role' => 'admin_adjoint', 'can_access_admin' => true],
            default => ['is_admin' => false, 'admin_role' => 'client', 'can_access_admin' => false],
        };
    }

    private function deriveRequestedAdminLevel(array $validated, Utilisateur $user): string
    {
        if (array_key_exists('statut', $validated) && in_array((string) $validated['statut'], ['suspendu', 'inactif'], true)) {
            return 'client';
        }

        $hasSuperAdmin = array_key_exists('is_super_admin', $validated);
        $hasAdminPays = array_key_exists('is_admin_pays', $validated);
        $hasAdminAdjoint = array_key_exists('is_admin_adjoint', $validated);

        if ($hasSuperAdmin || $hasAdminPays || $hasAdminAdjoint) {
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

    private function hasAnotherSuperAdmin(?string $exceptUserId = null): bool
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

        if ($requestedAdminLevel === 'client' && ! array_key_exists('can_access_client', $validated) && ! (bool) $user->can_access_client) {
            $validated['can_access_client'] = true;
        }

        if (array_key_exists('statut', $validated) && in_array((string) $validated['statut'], ['suspendu', 'inactif'], true)) {
            $validated['can_access_client'] = false;
            $validated['is_admin'] = false;
            $validated['admin_role'] = 'client';
            $validated['can_access_admin'] = false;
        }
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

    private function shouldPreserveCurrentAdminSession(Request $request, Utilisateur $target): bool
    {
        $actor = $request->user();
        if (! $actor) {
            return false;
        }
        if ($actor->getAuthIdentifier() !== $target->getAuthIdentifier()) {
            return false;
        }

        return $this->portalAccessAllowed($target, 'admin');
    }

    private function invalidateUserSessions(Utilisateur $user, ?Request $request = null, bool $preserveCurrentContext = false): void
    {
        $preservedTokenId = null;
        $preservedSessionId = null;

        if ($preserveCurrentContext && $request && $request->user()) {
            $actor = $request->user();
            if ($actor->getAuthIdentifier() === $user->getAuthIdentifier()) {
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
                $query->where('user_id', (string) $user->getAuthIdentifier())
                    ->orWhere('user_id', $user->getAuthIdentifier());
            });

        if ($preservedSessionId) {
            $sessions->where('id', '!=', $preservedSessionId);
        }
        $sessions->delete();
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

    private function normalizeTelephoneForCountry(?string $telephone, ?string $id_pays): ?string
    {
        if (! $telephone) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $telephone);
        if (! $digits) {
            return null;
        }

        $countryCodeDigits = null;
        $pays = null;
        if ($id_pays) {
            $pays = Pays::find($id_pays);
        }
        if ($pays && ! empty($pays->code_pays)) {
            $countryCodeDigits = preg_replace('/\D+/', '', $pays->code_pays);
        }

        $expectedLengths = ['225' => 8, '226' => 8, '228' => 8, '229' => 8, '227' => 8];

        if (strpos($digits, '00') === 0) {
            $digits = substr($digits, 2);
        }

        if ($countryCodeDigits) {
            $expected = $expectedLengths[$countryCodeDigits] ?? 8;

            if (strpos($digits, $countryCodeDigits) === 0) {
                $national = substr($digits, strlen($countryCodeDigits));
            } elseif (strlen($digits) === $expected + 1 && $digits[0] === '0') {
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

        if (strlen($digits) >= 8 && strlen($digits) <= 15) {
            return '+'.$digits;
        }

        return null;
    }

    private function generateTemporaryPassword(): string
    {
        return Str::upper(Str::random(4)).random_int(1000, 9999).'!';
    }
}
