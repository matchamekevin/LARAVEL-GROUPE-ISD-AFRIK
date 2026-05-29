<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProduitRequest;
use App\Http\Resources\ProduitResource;
use App\Models\Commande;
use App\Models\Paiement;
use App\Models\Produit;
use App\Services\ProduitService;
use App\Support\CacheVersion;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * ProduitController - VERSION COMPLÈTE AVEC FEDAPAY
 * Contrôleur REST pour la gestion des produits ISD AFRIK.
 */
class ProduitController extends Controller
{
    protected ProduitService $service;

    private const CACHE_TTL_SECONDS = 180;

    public function __construct(ProduitService $service)
    {
        $this->service = $service;
    }

    // ================================================================
    // ROUTES PUBLIQUES
    // ================================================================

    public function index(Request $request): JsonResponse
    {
        $excludeIds = $request->query('exclude_categorie_ids');
        $excludeList = [];
        if (is_string($excludeIds) && $excludeIds !== '') {
            $excludeList = array_values(array_filter(array_map('trim', explode(',', $excludeIds))));
        }

        $categoryFilter = $request->query('id_categorie');
        $categoryList = [];
        if (is_string($categoryFilter) && $categoryFilter !== '') {
            $categoryList = array_values(array_filter(array_map('trim', explode(',', $categoryFilter))));
        } elseif (is_array($categoryFilter)) {
            $categoryList = array_values(array_filter(array_map('trim', $categoryFilter)));
        }

        $statusFilter = $request->query('statut');
        $statusList = [];
        if (is_string($statusFilter) && $statusFilter !== '') {
            $statusList = array_values(array_filter(array_map('trim', explode(',', $statusFilter))));
        }

        $filters = [
            'id_pays' => $request->query('id_pays'),
            'id_categorie' => $request->query('id_categorie'),
            'id_categories' => $categoryList,
            'segment' => $request->query('segment'),
            'category_slug' => $request->query('category_slug'),
            'include_descendants' => $request->boolean('include_descendants'),
            'statut' => $statusFilter,
            'statuts' => $statusList,
            'modele' => $request->query('modele'),
            'prix_min' => $request->query('prix_min'),
            'prix_max' => $request->query('prix_max'),
            'marque' => $request->query('marque'),
            'en_vedette' => $request->query('en_vedette'),
            'en_promo' => $request->query('en_promo'),
            'est_nouveau' => $request->query('est_nouveau'),
            'recherche' => $request->query('q'),
            'tri' => $request->query('tri', 'recent'),
            'par_page' => $request->query('par_page', 12),
            'exclude_categorie_ids' => $excludeList,
        ];

        $produits = $this->service->getCatalogue($filters);

        return response()->json([
            'data' => ProduitResource::collection($produits->items()),
            'meta' => [
                'total' => $produits->total(),
                'par_page' => $produits->perPage(),
                'page_actuelle' => $produits->currentPage(),
                'derniere_page' => $produits->lastPage(),
                'de' => $produits->firstItem(),
                'a' => $produits->lastItem(),
            ],
            'links' => [
                'premiere' => $produits->url(1),
                'derniere' => $produits->url($produits->lastPage()),
                'suivante' => $produits->nextPageUrl(),
                'precedente' => $produits->previousPageUrl(),
            ],
        ]);
    }

    public function vedette(Request $request): JsonResponse
    {
        $cacheKey = CacheVersion::key('produits', 'vedette.'.md5($request->fullUrl()));

        $payload = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($request) {
            $produits = $this->service->getEnVedette($request->query('id_pays'));

            return [
                'message' => 'Produits en vedette',
                'data' => ProduitResource::collection($produits)->resolve(),
            ];
        });

        return response()->json($payload);
    }

    public function nouveaux(Request $request): JsonResponse
    {
        $cacheKey = CacheVersion::key('produits', 'nouveaux.'.md5($request->fullUrl()));

        $payload = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($request) {
            $produits = $this->service->getNouveaux($request->query('id_pays'));

            return [
                'message' => 'Nouveaux produits',
                'data' => ProduitResource::collection($produits)->resolve(),
            ];
        });

        return response()->json($payload);
    }

    public function promotions(Request $request): JsonResponse
    {
        $cacheKey = CacheVersion::key('produits', 'promotions.'.md5($request->fullUrl()));

        $payload = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($request) {
            $produits = $this->service->getEnPromotion($request->query('id_pays'));

            return [
                'message' => 'Produits en promotion',
                'data' => ProduitResource::collection($produits)->resolve(),
            ];
        });

        return response()->json($payload);
    }

    public function recherche(Request $request)
    {
        $q = $request->input('q');
        $idPays = $request->query('id_pays');
        $perPage = max(1, min(50, (int) $request->query('per_page', 12)));

        $cacheKey = CacheVersion::key('produits', 'recherche.'.md5($request->fullUrl()));

        $payload = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($q, $idPays, $perPage) {
            $produits = Produit::with(['pays', 'images'])
                ->where(function ($query) use ($q) {
                    $query->where('titre', 'ILIKE', "%{$q}%")
                        ->orWhere('slug', 'ILIKE', "%{$q}%")
                        ->orWhere('marque', 'ILIKE', "%{$q}%")
                        ->orWhere('description', 'ILIKE', "%{$q}%");
                })
                ->parPays($idPays)
                ->orderByDesc('date_creation')
                ->paginate($perPage);

            return [
                'message' => "Résultats pour \"$q\"",
                'data' => ProduitResource::collection($produits->items()),
                'meta' => [
                    'total' => $produits->total(),
                    'par_page' => $produits->perPage(),
                    'page_actuelle' => $produits->currentPage(),
                    'derniere_page' => $produits->lastPage(),
                ],
            ];
        });

        return response()->json($payload);
    }

    public function marques(Request $request): JsonResponse
    {
        $idPays = $request->query('id_pays');
        $cacheKey = CacheVersion::key('produits', 'marques.'.md5($request->fullUrl()));

        $payload = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($idPays) {
            $marques = Produit::query()
                ->parPays($idPays)
                ->where('statut', 'disponible')
                ->whereNotNull('marque')
                ->distinct()
                ->orderBy('marque')
                ->pluck('marque');

            return [
                'message' => 'Marques disponibles',
                'data' => $marques,
            ];
        });

        return response()->json($payload);
    }

    public function show(string $id): JsonResponse
    {
        $cacheKey = CacheVersion::key('produits', 'detail.'.$id);

        $produit = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($id) {
            return $this->service->getById($id);
        });

        if (! $produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $produit->incrementerVues();

        return response()->json([
            'message' => 'Produit trouvé',
            'data' => new ProduitResource($produit),
        ]);
    }

    public function showBySlug(string $slug): JsonResponse
    {
        $cacheKey = CacheVersion::key('produits', 'slug.'.md5($slug));

        $produit = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($slug) {
            return $this->service->getBySlug($slug);
        });

        if (! $produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $produit->incrementerVues();

        return response()->json([
            'message' => 'Produit trouvé',
            'data' => new ProduitResource($produit),
        ]);
    }

    // ================================================================
    // PAIEMENT FEDAPAY — ACHAT PRODUIT
    // ================================================================

    /**
     * POST /api/produits/{id}/acheter
     * Crée une commande + paiement en_attente (auth requise)
     */
    public function acheterProduit(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Authentification requise.'], 401);
        }

        $produit = $this->service->getById($id);

        if (! $produit) {
            return response()->json(['message' => 'Produit introuvable.'], 404);
        }

        if ($produit->statut === 'rupture') {
            return response()->json(['message' => 'Ce produit est en rupture de stock.'], 409);
        }

        $data = $request->validate([
            'quantite' => 'required|integer|min:1',
            'nom_livraison' => 'required|string|max:255',
            'prenom_livraison' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'telephone' => 'required|string|max:50',
            'adresse' => 'required|string|max:500',
            'ville' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $quantite = (int) $data['quantite'];
        $userId = $user->getKey();
        $prixFinal = $produit->isPrixPromoActif() ? (float) $produit->prix_promo : (float) $produit->prix;
        $montant = $prixFinal * $quantite;

        if ($produit->stock < $quantite) {
            return response()->json([
                'message' => "Stock insuffisant. Disponible : {$produit->stock}",
            ], 409);
        }

        try {
            // 1. Créer la commande
            $commande = Commande::create([
                'numero_commande' => 'CMD-'.strtoupper(Str::random(10)),
                'statut' => 'en_attente',
                'type_commande' => 'produit',
                'montant_total' => $montant,
                'id_utilisateur' => $userId,
            ]);

            // 2. Créer le paiement lié à la commande
            $paiement = Paiement::create([
                'reference_transaction' => (string) Str::uuid(),
                'moyen_paiement' => 'fedapay',
                'statut_paiement' => 'en_attente',
                'montant' => $montant,
                'date_paiement' => now(),
                'id_commande' => $commande->id_commande,
                'id_utilisateur' => $userId,
            ]);

            // 3. Décrémenter le stock
            $produit->decrement('stock', $quantite);
            if ($produit->fresh()->stock <= 0) {
                $produit->update(['statut' => 'rupture']);
            }

            return response()->json([
                'message' => 'Commande enregistrée ✅',
                'commande' => [
                    'id_commande' => $commande->id_commande,
                    'numero_commande' => $commande->numero_commande,
                    'produit' => $produit->titre,
                    'quantite' => $quantite,
                    'prix_unitaire' => $prixFinal,
                    'montant_total' => $montant,
                    'nom_livraison' => $data['nom_livraison'],
                    'prenom_livraison' => $data['prenom_livraison'],
                    'email' => $data['email'],
                    'telephone' => $data['telephone'],
                    'adresse' => $data['adresse'],
                ],
                'paiement' => [
                    'id_paiement' => $paiement->id_paiement,
                    'statut_paiement' => $paiement->statut_paiement,
                    'montant' => $paiement->montant,
                    'reference' => $paiement->reference_transaction,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'enregistrement de la commande.',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * POST /api/paiements-produit/{idPaiement}/init
     * Initialise FedaPay et retourne le checkout_url (auth requise)
     */
    public function initPaiementProduit(Request $request, string $idPaiement): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['message' => 'Authentification requise.'], 401);
        }

        $paiement = Paiement::with(['commande', 'utilisateur'])->find($idPaiement);

        if (! $paiement) {
            return response()->json(['message' => 'Paiement introuvable.'], 404);
        }

        if ($paiement->id_utilisateur !== $authUser->getKey() && ! $authUser->is_admin) {
            return response()->json(['message' => 'Accès interdit à ce paiement.'], 403);
        }

        if ($paiement->statut_paiement === 'complete') {
            return response()->json(['message' => 'Ce paiement a déjà été effectué.'], 409);
        }

        try {
            \FedaPay\FedaPay::setApiKey(config('services.fedapay.secret'));
            \FedaPay\FedaPay::setEnvironment(config('services.fedapay.env', 'live'));

            $transaction = \FedaPay\Transaction::create([
                'amount' => (float) $paiement->montant,
                'currency' => ['iso' => 'XOF'],
                'description' => 'Achat produit — Commande '.($paiement->commande->numero_commande ?? $paiement->id_commande),
                'customer' => [
                    'email' => $authUser->email,
                    'firstname' => $authUser->prenom ?? '',
                    'lastname' => $authUser->nom ?? '',
                ],
                'callback_url' => route('paiement.produit.callback'),
            ]);

            // Sauvegarder l'ID transaction FedaPay
            $paiement->update([
                'reference_transaction' => (string) $transaction->id,
            ]);

            return response()->json([
                'message' => 'Paiement initié ✅',
                'checkout_url' => $transaction->generateCheckoutUrl(),
                'transaction_id' => $transaction->id,
                'paiement' => [
                    'id_paiement' => $paiement->id_paiement,
                    'statut_paiement' => $paiement->statut_paiement,
                    'montant' => $paiement->montant,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur FedaPay.',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Récupère les détails d'une transaction FedaPay pour enrichir le message d'erreur
     */
    private function fetchFedapayTransactionDetails(string $transactionId): ?array
    {
        try {
            \FedaPay\FedaPay::setApiKey(config('services.fedapay.secret'));
            \FedaPay\FedaPay::setEnvironment(config('services.fedapay.env', 'live'));

            $transaction = \FedaPay\Transaction::retrieve($transactionId);

            return [
                'status' => $transaction->status ?? null,
                'description' => $transaction->description ?? null,
                'mode' => $transaction->mode ?? null,
            ];
        } catch (\Exception $e) {
            Log::warning('Impossible de récupérer la transaction FedaPay', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Restaurer le stock produit lié à un paiement
     */
    private function restaurerStockPaiement(string $idPaiement): void
    {
        $paiement = Paiement::find($idPaiement);

        if (! $paiement || ! $paiement->id_produit || ! $paiement->quantite) {
            return;
        }

        $produit = Produit::find($paiement->id_produit);
        if ($produit) {
            $produit->increment('stock', $paiement->quantite);
            if ($produit->statut === 'rupture' && $produit->fresh()->stock > 0) {
                $produit->update(['statut' => 'disponible']);
            }
        }
    }

    /**
     * Redirige le navigateur avec une page HTML + JS pour garantir la redirection
     */
    private function redirectWithFallback(string $url): \Illuminate\Http\Response
    {
        $escapedUrl = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');

        return response()->make(
            <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Redirection...</title>
    <meta http-equiv="refresh" content="0;url={$escapedUrl}">
    <script>window.location.replace("{$escapedUrl}");</script>
</head>
<body>
    <p>Redirection en cours... <a href="{$escapedUrl}">Cliquez ici si rien ne se passe</a></p>
</body>
</html>
HTML
            , 200, ['Content-Type' => 'text/html']
        );
    }

    /**
     * GET|POST /api/paiements-produit/callback
     * Webhook FedaPay — PUBLIQUE
     */
    public function callbackPaiementProduit(Request $request)
    {
        $transactionId = $request->input('id') ?? $request->input('transaction_id');
        $statut = strtolower((string) ($request->input('status') ?? ''));
        $errorMessage = $request->input('message');

        Log::info('FedaPay callback produit reçu', [
            'id' => $transactionId,
            'status' => $statut,
            'message' => $errorMessage,
            'method' => $request->method(),
        ]);

        $frontendUrl = config('app.frontend_url');

        if (! $transactionId) {
            if ($request->isMethod('get')) {
                return $this->redirectWithFallback($frontendUrl.'/paiement/result?status=erreur&message='.urlencode('Transaction introuvable'));
            }

            return response()->json(['message' => 'Paramètre transaction manquant.'], 400);
        }

        $paiement = Paiement::with(['commande', 'produit'])
            ->where('reference_transaction', (string) $transactionId)
            ->whereNotNull('id_commande')
            ->first();

        if (! $paiement) {
            if ($request->isMethod('get')) {
                return $this->redirectWithFallback($frontendUrl.'/paiement/result?status=erreur&message='.urlencode('Paiement introuvable'));
            }

            return response()->json(['message' => 'Paiement introuvable.'], 404);
        }

        // ✅ Quand l'utilisateur ferme la page FedaPay
        $close = $request->input('close');

        // ✅ Statuts FedaPay → statuts applicatifs unifiés
        $statutApp = match ($statut) {
            'approved' => 'réussi',
            'declined' => 'échoué',
            'cancelled', 'canceled' => 'échoué',
            'expired' => 'échoué',
            'pending' => $close === 'true' ? 'échoué' : 'en_attente',
            default => 'en_attente',
        };

        // Éviter de retraiter un paiement déjà dans un état final
        if (in_array($paiement->statut_paiement, ['réussi', 'échoué'])) {
            Log::info('Paiement produit déjà traité', [
                'id_paiement' => $paiement->id_paiement,
                'statut' => $paiement->statut_paiement,
                'nouveau' => $statutApp,
            ]);

            if ($request->isMethod('get')) {
                if ($paiement->statut_paiement === 'réussi') {
                    return $this->redirectWithFallback($frontendUrl.'/facture/'.$paiement->id_paiement);
                }

                $params = http_build_query([
                    'status' => 'echoue',
                    'message' => 'Paiement déjà traité',
                    'type' => 'commande',
                    'id' => $paiement->id_commande,
                ]);

                return $this->redirectWithFallback($frontendUrl.'/paiement/result?'.$params);
            }

            return response()->json(['message' => 'Déjà traité', 'statut' => $paiement->statut_paiement], 200);
        }

        // Mise à jour du statut
        $paiement->update(['statut_paiement' => $statutApp, 'date_paiement' => now()]);

        if ($paiement->commande) {
            $paiement->commande->update([
                'statut' => $statutApp === 'réussi' ? 'payée' : 'échouée',
            ]);
        }

        // Restaurer le stock en cas d'échec
        if ($statutApp === 'échoué' && $paiement->id_produit && $paiement->quantite) {
            $this->restaurerStockPaiement($paiement->id_paiement);
        }

        // Redirection navigateur pour les requêtes GET
        if ($request->isMethod('get')) {
            if ($statutApp === 'réussi') {
                return $this->redirectWithFallback($frontendUrl.'/facture/'.$paiement->id_paiement);
            }

            // Vérifier si l'utilisateur a fermé la page de paiement
            if ($close === 'true') {
                $errorMessage = 'Paiement annulé — vous avez fermé la page de paiement';
            }

            // Essayer d'obtenir le vrai message d'erreur depuis l'API FedaPay
            if (! $errorMessage) {
                $details = $this->fetchFedapayTransactionDetails($transactionId);

                if ($details && $details['status']) {
                    $fedapayStatus = $details['status'];
                    $errorMessage = match ($fedapayStatus) {
                        'canceled' => 'Paiement annulé par l\'utilisateur',
                        'declined' => 'Transaction refusée par la banque ou l\'opérateur (solde insuffisant, code erroné, etc.)',
                        'expired' => 'Le délai de paiement a expiré',
                        'pending' => 'Paiement annulé — vous avez fermé la fenêtre de paiement',
                        default => 'Erreur de paiement : '.$fedapayStatus,
                    };

                    if (! empty($details['description'])) {
                        $errorMessage = $details['description'];
                    }
                } else {
                    $errorMessage = match ($statut) {
                        'canceled', 'cancelled' => 'Paiement annulé',
                        'declined' => 'Paiement refusé',
                        'expired' => 'La session de paiement a expiré',
                        'pending' => 'Paiement annulé',
                        default => 'Erreur de paiement',
                    };
                }
            }

            $params = http_build_query([
                'status' => 'echoue',
                'message' => $errorMessage,
                'type' => 'commande',
                'id' => $paiement->id_commande,
            ]);

            return $this->redirectWithFallback($frontendUrl.'/paiement/result?'.$params);
        }

        return response()->json([
            'message' => 'Statut paiement mis à jour.',
            'statut' => $statutApp,
        ], 200);
    }

    // ================================================================
    // ROUTES ADMIN
    // ================================================================

    public function adminIndex(Request $request): JsonResponse
    {
        $segment = $request->query('segment', 'general');
        $perPage = max(1, min(50, (int) $request->query('per_page', 12)));
        $page = max(1, (int) $request->query('page', 1));
        $search = trim((string) $request->query('q', ''));
        $status = trim((string) $request->query('statut', ''));
        $trashed = strtolower(trim((string) $request->query('trashed', '')));

        $query = Produit::query()
            ->with(['pays', 'categorie.parent', 'images'])
            ->when($trashed === 'only', fn ($b) => $b->onlyTrashed())
            ->when($trashed === 'with' || $trashed === 'all', fn ($b) => $b->withTrashed())
            ->whereHas('categorie', fn ($q) => $q->where('segment', $segment))
            ->when($request->filled('id_categorie'), fn ($q) => $q->where('id_categorie', $request->query('id_categorie')))
            ->when($search !== '', function ($q) use ($search) {
                $like = "%{$search}%";
                $q->where(function ($n) use ($like) {
                    $n->where('titre', 'ILIKE', $like)
                        ->orWhere('description', 'ILIKE', $like)
                        ->orWhere('marque', 'ILIKE', $like)
                        ->orWhere('reference', 'ILIKE', $like)
                        ->orWhere('modele', 'ILIKE', $like)
                        ->orWhere('slug', 'ILIKE', $like);
                });
            })
            ->when($status !== '' && strtolower($status) !== 'all', fn ($q) => $q->where('statut', $status))
            ->when($request->filled('en_vedette'), fn ($q) => $q->where('est_en_vedette', $request->boolean('en_vedette')))
            ->when($request->filled('modele'), fn ($q) => $q->where('modele', 'LIKE', "%{$request->query('modele')}%"))
            ->orderByDesc('date_creation')
            ->paginate($perPage, ['*'], 'page', $page)
            ->appends($request->query());

        $data = collect($query->items())
            ->map(fn ($p) => (new ProduitResource($p))->resolve())
            ->all();

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $query->total(),
                'per_page' => $query->perPage(),
                'current_page' => $query->currentPage(),
                'last_page' => $query->lastPage(),
                'from' => $query->firstItem(),
                'to' => $query->lastItem(),
            ],
            'links' => [
                'first' => $query->url(1),
                'last' => $query->url($query->lastPage()),
                'next' => $query->nextPageUrl(),
                'prev' => $query->previousPageUrl(),
            ],
        ]);
    }

    public function store(ProduitRequest $request): JsonResponse
    {
        try {
            $produit = $this->service->create($request->validated());
        } catch (QueryException $e) {
            if ($this->isUniqueViolation($e, 'produits_reference_unique')) {
                return response()->json(['message' => 'Validation échouée', 'errors' => ['reference' => ['Cette référence produit existe déjà.']]], 422);
            }
            throw $e;
        }

        CacheVersion::bump('produits');

        return response()->json([
            'message' => 'Produit créé avec succès',
            'data' => new ProduitResource($produit->load(['pays', 'categorie', 'images'])),
        ], 201);
    }

    public function update(ProduitRequest $request, string $id): JsonResponse
    {
        $produit = $this->service->getById($id);

        if (! $produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        try {
            $updated = $this->service->update($produit, $request->validated());
        } catch (QueryException $e) {
            if ($this->isUniqueViolation($e, 'produits_reference_unique')) {
                return response()->json(['message' => 'Validation échouée', 'errors' => ['reference' => ['Cette référence produit existe déjà.']]], 422);
            }
            throw $e;
        }

        CacheVersion::bump('produits');

        return response()->json([
            'message' => 'Produit mis à jour avec succès',
            'data' => new ProduitResource($updated->load(['pays', 'categorie', 'images'])),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $produit = $this->service->getById($id);

        if (! $produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $this->service->delete($produit);
        CacheVersion::bump('produits');

        return response()->json(['message' => 'Produit supprimé avec succès']);
    }

    public function forceDestroy(string $id): JsonResponse
    {
        $produit = Produit::withTrashed()->find($id);

        if (! $produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        if (! $this->service->forceDelete($id)) {
            return response()->json(['message' => 'Suppression définitive impossible'], 500);
        }

        CacheVersion::bump('produits');

        return response()->json(['message' => 'Produit supprimé définitivement']);
    }

    public function restore(string $id): JsonResponse
    {
        $produit = Produit::withTrashed()->find($id);

        if (! $produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        if ($produit->deleted_at === null) {
            return response()->json(['message' => 'Produit déjà actif'], 400);
        }

        $produit->restore();
        CacheVersion::bump('produits');

        return response()->json([
            'message' => 'Produit restauré avec succès',
            'data' => new ProduitResource($produit),
        ]);
    }

    public function uploadImages(Request $request, string $id): JsonResponse
    {
        $replace = $request->boolean('replace');

        $request->validate([
            'replace' => 'nullable|boolean',
            'images' => 'required|array|max:'.($replace ? 1 : 6),
            'images.*' => 'required|image|mimes:jpeg,png,jpg,webp|max:3072',
        ]);

        $produit = $this->service->getById($id);

        if (! $produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $urls = $this->service->uploadImages($produit, $request->file('images'), $replace);
        CacheVersion::bump('produits');

        return response()->json([
            'message' => $replace ? 'Image remplacée avec succès' : count($urls).' image(s) uploadée(s) avec succès',
            'images' => $urls,
        ], 201);
    }

    public function deleteImage(string $id, string $imageId): JsonResponse
    {
        $produit = $this->service->getById($id);

        if (! $produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        if (! $this->service->deleteImage($produit, $imageId)) {
            return response()->json(['message' => 'Image introuvable'], 404);
        }

        CacheVersion::bump('produits');

        return response()->json(['message' => 'Image supprimée avec succès']);
    }

    public function updateStock(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'stock' => 'required|integer|min:0',
            'stock_alerte' => 'nullable|integer|min:0',
        ]);

        $produit = $this->service->getById($id);

        if (! $produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $data = ['stock' => $request->input('stock')];

        if ($request->has('stock_alerte')) {
            $data['stock_alerte'] = $request->input('stock_alerte');
        }

        if ($request->input('stock') === 0) {
            $data['statut'] = 'rupture';
        } elseif ($produit->statut === 'rupture') {
            $data['statut'] = 'disponible';
        }

        $produit->update($data);
        CacheVersion::bump('produits');

        return response()->json([
            'message' => 'Stock mis à jour',
            'stock' => $produit->stock,
            'statut' => $produit->statut,
        ]);
    }

    public function toggleVedette(string $id): JsonResponse
    {
        $produit = $this->service->getById($id);

        if (! $produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $produit->update(['est_en_vedette' => ! $produit->est_en_vedette]);
        CacheVersion::bump('produits');

        return response()->json([
            'message' => $produit->est_en_vedette ? 'Produit mis en vedette' : 'Produit retiré de la vedette',
            'est_en_vedette' => $produit->est_en_vedette,
        ]);
    }

    // ================================================================
    // UTILITAIRES
    // ================================================================

    private function isUniqueViolation(QueryException $exception, string $constraint): bool
    {
        $sqlState = (string) ($exception->errorInfo[0] ?? '');
        $message = (string) $exception->getMessage();

        return $sqlState === '23505' || str_contains($message, $constraint);
    }
}
