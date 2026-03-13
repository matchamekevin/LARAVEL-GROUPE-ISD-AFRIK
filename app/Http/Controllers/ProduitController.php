<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProduitRequest;
use App\Http\Resources\ProduitResource;
use App\Models\Produit;
use App\Services\ProduitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ProduitController - VERSION COMPLÈTE
 * Contrôleur REST pour la gestion des produits ISD AFRIK.
 */
class ProduitController extends Controller
{
    protected ProduitService $service;

    public function __construct(ProduitService $service)
    {
        $this->service = $service;
    }

    // ================================================================
    // ROUTES PUBLIQUES
    // ================================================================

    /**
     * GET /api/produits
     * Liste tous les produits avec filtres, recherche et pagination
     */
    public function index(Request $request): JsonResponse
    {
        $excludeIds = $request->query('exclude_categorie_ids');
        $excludeList = [];
        if (is_string($excludeIds) && $excludeIds !== '') {
            $excludeList = array_values(array_filter(array_map('intval', explode(',', $excludeIds))));
        }

        $filters = [
            'id_pays'      => $request->query('id_pays'),
            'id_categorie' => $request->query('id_categorie'),
            'statut'       => $request->query('statut', 'disponible'),
            'prix_min'     => $request->query('prix_min'),
            'prix_max'     => $request->query('prix_max'),
            'marque'       => $request->query('marque'),
            'en_vedette'   => $request->query('en_vedette'),
            'en_promo'     => $request->query('en_promo'),
            'est_nouveau'  => $request->query('est_nouveau'),
            'recherche'    => $request->query('q'),
            'tri'          => $request->query('tri', 'recent'),   // recent|prix_asc|prix_desc|populaire|note
            'par_page'     => $request->query('par_page', 12),
            'exclude_categorie_ids' => $excludeList,
        ];

        $produits = $this->service->getCatalogue($filters);

        return response()->json([
            'data'  => ProduitResource::collection($produits->items()),
            'meta'  => [
                'total'        => $produits->total(),
                'par_page'     => $produits->perPage(),
                'page_actuelle'=> $produits->currentPage(),
                'derniere_page'=> $produits->lastPage(),
                'de'           => $produits->firstItem(),
                'a'            => $produits->lastItem(),
            ],
            'links' => [
                'premiere' => $produits->url(1),
                'derniere' => $produits->url($produits->lastPage()),
                'suivante' => $produits->nextPageUrl(),
                'precedente'=> $produits->previousPageUrl(),
            ],
        ]);
    }

    /**
     * GET /api/produits/vedette
     * Produits en vedette pour la page d'accueil
     */
    public function vedette(): JsonResponse
    {
        $produits = $this->service->getEnVedette();

        return response()->json([
            'message' => 'Produits en vedette',
            'data'    => ProduitResource::collection($produits),
        ]);
    }

    /**
     * GET /api/produits/nouveaux
     * Nouveaux produits
     */
    public function nouveaux(): JsonResponse
    {
        $produits = $this->service->getNouveaux();

        return response()->json([
            'message' => 'Nouveaux produits',
            'data'    => ProduitResource::collection($produits),
        ]);
    }

    /**
     * GET /api/produits/promotions
     * Produits en promotion
     */
    public function promotions(): JsonResponse
    {
        $produits = $this->service->getEnPromotion();

        return response()->json([
            'message' => 'Produits en promotion',
            'data'    => ProduitResource::collection($produits),
        ]);
    }

    /**
     * GET /api/produits/recherche?q=laptop
     * Recherche textuelle dans les produits
     */
    public function recherche(Request $request)
{
    $q = $request->input('q');

    $produits = Produit::where('titre', 'ILIKE', "%{$q}%")
        ->orWhere('slug', 'ILIKE', "%{$q}%")
        ->orWhere('marque', 'ILIKE', "%{$q}%")
        ->orWhere('description', 'ILIKE', "%{$q}%")
        ->get();

    return response()->json([
        'message' => "Résultats pour \"$q\"",
        'total'   => $produits->count(),
        'data'    => $produits,
    ]);
}

    /**
     * GET /api/produits/marques
     * Liste des marques disponibles (pour le filtre)
     */
    public function marques(Request $request): JsonResponse
    {
        $idPays = $request->query('id_pays');

        $marques = Produit::query()
            ->when($idPays, fn($q) => $q->where('id_pays', $idPays))
            ->where('statut', 'disponible')
            ->whereNotNull('marque')
            ->distinct()
            ->orderBy('marque')
            ->pluck('marque');

        return response()->json([
            'message' => 'Marques disponibles',
            'data'    => $marques,
        ]);
    }

    /**
     * GET /api/produits/{id}
     * Détail d'un produit avec toutes ses relations
     */
    public function show(int $id): JsonResponse
    {
        $produit = $this->service->getById($id);

        if (!$produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        // Incrémenter le compteur de vues
        $produit->incrementerVues();

        return response()->json([
            'message' => 'Produit trouvé',
            'data'    => new ProduitResource($produit),
        ]);
    }

    /**
     * GET /api/produits/slug/{slug}
     * Récupérer un produit par son slug (pour le SEO)
     */
    public function showBySlug(string $slug): JsonResponse
    {
        $produit = $this->service->getBySlug($slug);

        if (!$produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $produit->incrementerVues();

        return response()->json([
            'message' => 'Produit trouvé',
            'data'    => new ProduitResource($produit),
        ]);
    }

    // ================================================================
    // ROUTES ADMIN (protégées par auth:sanctum + middleware admin)
    // ================================================================

    /**
     * POST /api/produits
     * Créer un nouveau produit
     */
    public function store(ProduitRequest $request): JsonResponse
    {
        $produit = $this->service->create($request->validated());

        return response()->json([
            'message' => 'Produit créé avec succès',
            'data'    => new ProduitResource($produit->load(['pays', 'categorie', 'images'])),
        ], 201);
    }

    /**
     * PUT /api/produits/{id}
     * Mettre à jour un produit
     */
    public function update(ProduitRequest $request, int $id): JsonResponse
    {
        $produit = $this->service->getById($id);

        if (!$produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $updated = $this->service->update($produit, $request->validated());

        return response()->json([
            'message' => 'Produit mis à jour avec succès',
            'data'    => new ProduitResource($updated->load(['pays', 'categorie', 'images'])),
        ]);
    }

    /**
     * DELETE /api/produits/{id}
     * Suppression logique (soft delete)
     */
    public function destroy(int $id): JsonResponse
    {
        $produit = $this->service->getById($id);

        if (!$produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $this->service->delete($produit);

        return response()->json(['message' => 'Produit supprimé avec succès']);
    }

    /**
     * PATCH /api/produits/{id}/restore
     * Restaurer un produit soft-deleted
     */
    public function restore(int $id): JsonResponse
    {
        $produit = Produit::withTrashed()->find($id);

        if (!$produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        if ($produit->deleted_at === null) {
            return response()->json(['message' => 'Produit déjà actif'], 400);
        }

        $produit->restore();

        return response()->json([
            'message' => 'Produit restauré avec succès',
            'data'    => new ProduitResource($produit),
        ]);
    }

    /**
     * POST /api/produits/{id}/images
     * Upload d'images pour un produit
     */
    public function uploadImages(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'images'   => 'required|array|max:6',
            'images.*' => 'required|image|mimes:jpeg,png,jpg,webp|max:3072', // max 3MB
        ]);

        $produit = $this->service->getById($id);

        if (!$produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $urls = $this->service->uploadImages($produit, $request->file('images'));

        return response()->json([
            'message' => count($urls) . ' image(s) uploadée(s) avec succès',
            'images'  => $urls,
        ], 201);
    }

    /**
     * DELETE /api/produits/{id}/images/{imageId}
     * Supprimer une image d'un produit
     */
    public function deleteImage(int $id, int $imageId): JsonResponse
    {
        $produit = $this->service->getById($id);

        if (!$produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $deleted = $this->service->deleteImage($produit, $imageId);

        if (!$deleted) {
            return response()->json(['message' => 'Image introuvable'], 404);
        }

        return response()->json(['message' => 'Image supprimée avec succès']);
    }

    /**
     * PATCH /api/produits/{id}/stock
     * Mettre à jour le stock d'un produit
     */
    public function updateStock(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'stock'        => 'required|integer|min:0',
            'stock_alerte' => 'nullable|integer|min:0',
        ]);

        $produit = $this->service->getById($id);

        if (!$produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $data = ['stock' => $request->stock];

        if ($request->has('stock_alerte')) {
            $data['stock_alerte'] = $request->stock_alerte;
        }

        // Mettre le statut à "rupture" si stock = 0
        if ($request->stock === 0) {
            $data['statut'] = 'rupture';
        } elseif ($produit->statut === 'rupture') {
            $data['statut'] = 'disponible';
        }

        $produit->update($data);

        return response()->json([
            'message' => 'Stock mis à jour',
            'stock'   => $produit->stock,
            'statut'  => $produit->statut,
        ]);
    }

    /**
     * PATCH /api/produits/{id}/vedette
     * Basculer le statut "en vedette"
     */
    public function toggleVedette(int $id): JsonResponse
    {
        $produit = $this->service->getById($id);

        if (!$produit) {
            return response()->json(['message' => 'Produit introuvable'], 404);
        }

        $produit->update(['est_en_vedette' => !$produit->est_en_vedette]);

        return response()->json([
            'message'      => $produit->est_en_vedette ? 'Produit mis en vedette' : 'Produit retiré de la vedette',
            'est_en_vedette' => $produit->est_en_vedette,
        ]);
    }
}