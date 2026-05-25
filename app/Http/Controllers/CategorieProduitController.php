<?php

namespace App\Http\Controllers;

use App\Models\CategorieProduit;
use App\Models\Produit;
use App\Services\Base64ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Support\CacheVersion;

class CategorieProduitController extends Controller
{
    private const SLUG_MAX_TRIES = 50;
    private const CACHE_TTL_SECONDS = 300;

    private function categorySelectColumns(): array
    {
        return [
            'id_categorie',
            'nom',
            'description',
            'segment',
            'image_url',
            'image',
            'slug',
            'icone',
            'parent_id',
            'ordre',
            'display_mode',
            'actif',
            'created_at',
            'updated_at',
        ];
    }

    private function selectImageColumns($query): void
    {
        $query->select([
            'id_image',
            'url',
            'path',
            'alt',
            'imageable_id',
            'imageable_type',
            'created_at',
            'updated_at',
        ])->addSelect(DB::raw('image_data IS NOT NULL AS has_image_data'));
    }

    private function cacheKey(Request $request, string $suffix): string
    {
        return CacheVersion::key('categories', $suffix . '.' . md5($request->fullUrl()));
    }

    private function bumpCache(): void
    {
        CacheVersion::bump('categories');
    }

    /**
     * GET /api/categories-produits
     */
    public function index(Request $request)
    {
        $cacheKey = $this->cacheKey($request, 'index');

        $payload = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($request) {
            $query = CategorieProduit::query()
            ->select($this->categorySelectColumns())
            ->withCount('produits')
            ->with(['parent' => fn ($q) => $q->select($this->categorySelectColumns())])
            ->orderBy('ordre')
            ->orderBy('nom');

            if ($request->filled('segment')) {
                $query->where('segment', $request->query('segment'));
            }

            if ($request->filled('id_pays') && \Illuminate\Support\Str::isUuid($request->query('id_pays'))) {
                $idPays = $request->query('id_pays');

                $leafIds = CategorieProduit::whereHas('produits', fn ($q) => $q->parPays($idPays))
                    ->pluck('id_categorie');

                if ($leafIds->isEmpty()) {
                    $query->whereRaw('1=0');
                } else {
                    $allNodeIds = $leafIds->toArray();
                    $visited = $leafIds->toArray();

                    while (! empty($visited)) {
                        $parents = CategorieProduit::whereIn('id_categorie', $visited)
                            ->whereNotNull('parent_id')
                            ->pluck('parent_id')
                            ->unique()
                            ->values()
                            ->toArray();

                        $newParents = array_diff($parents, $allNodeIds);
                        if (empty($newParents)) break;

                        $allNodeIds = array_merge($allNodeIds, $newParents);
                        $visited = $newParents;
                    }

                    $query->whereIn('id_categorie', $allNodeIds);
                }
            }

            if ($request->boolean('tree')) {
                $query->whereNull('parent_id')
                    ->with('childrenRecursive');
            } elseif ($request->filled('parent_id')) {
                $parentId = $request->query('parent_id');
                if ($parentId === 'null') {
                    $query->whereNull('parent_id');
                } else {
                    $query->where('parent_id', $parentId);
                }
            }

            if ($request->boolean('with_products')) {
                $query->with(['produits.images' => function ($q) {
                    $this->selectImageColumns($q);
                }]);
            }

            return $query->get()->makeHidden(['image_data', 'image_mime'])->toArray();
        });

        return response()->json($payload);
    }

    /**
     * GET /api/categories-produits/{id}
     */
    public function show(Request $request, $id)
    {
        $cacheKey = $this->cacheKey($request, 'show.' . $id);

        $payload = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($request, $id) {
            $categorie = CategorieProduit::query()
                ->select($this->categorySelectColumns())
                ->withCount('produits')
                ->with(['parent.parent' => fn ($q) => $q->select($this->categorySelectColumns())])
                ->findOrFail($id);

            $hidden = ['image_data', 'image_mime'];

            if ($request->boolean('tree')) {
                $categorie->load('childrenRecursive');
                return $categorie->makeHidden($hidden)->toArray();
            }

            $displayMode = $categorie->display_mode ?? 'auto';
            $hasChildren = $categorie->children()->exists();

            if ($displayMode === 'children' || ($displayMode === 'auto' && $hasChildren)) {
                $categorie->load('children');
                return $categorie->makeHidden($hidden)->toArray();
            }

            $categorie->load(['produits.images' => function ($q) {
                $this->selectImageColumns($q);
            }]);
            return $categorie->makeHidden($hidden)->toArray();
        });

        return response()->json($payload);
    }

    /**
     * GET /api/categories-produits/slug/{slug}
     */
    public function showBySlug(Request $request, string $slug)
    {
        $cacheKey = $this->cacheKey($request, 'slug.' . $slug);

        $payload = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($request, $slug) {
            $categorie = CategorieProduit::query()
                ->select($this->categorySelectColumns())
                ->withCount('produits')
                ->with(['parent.parent' => fn ($q) => $q->select($this->categorySelectColumns())])
                ->where('slug', $slug)
                ->firstOrFail();

            $hidden = ['image_data', 'image_mime'];

            if ($request->boolean('tree')) {
                $categorie->load('childrenRecursive');
                return $categorie->makeHidden($hidden)->toArray();
            }

            $displayMode = $categorie->display_mode ?? 'auto';
            $hasChildren = $categorie->children()->exists();

            if ($displayMode === 'children' || ($displayMode === 'auto' && $hasChildren)) {
                $categorie->load('children');
                return $categorie->makeHidden($hidden)->toArray();
            }

            $categorie->load(['produits.images' => function ($q) {
                $this->selectImageColumns($q);
            }]);
            return $categorie->makeHidden($hidden)->toArray();
        });

        return response()->json($payload);
    }

    /**
     * GET /api/categories-produits/{id}/image
     */
    public function image($id)
    {
        if (!Str::isUuid($id)) {
            return response()->noContent(204);
        }

        $categorie = CategorieProduit::find($id);

        if (!$categorie || !$categorie->image_data) {
            return response()->noContent(204);
        }

        return Base64ImageService::response($categorie->image_data, $categorie->image_mime);
    }

    /**
     * POST /api/categories-produits (admin)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            // slug uniqueness is ensured after normalization (auto-suffix if needed)
            'slug' => 'nullable|string|max:160',
            'description' => 'nullable|string',
            'icone' => 'nullable|string',
            'segment' => 'nullable|string|max:100',
            'image_url' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            // allow legacy/alternate field name from some forms
            'image_file' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            'parent_id' => 'nullable|uuid|exists:categories_produits,id_categorie',
            'ordre' => 'nullable|integer|min:0',
            'actif' => 'nullable|boolean',
        ]);

        $uploaded = $request->file('image') ?: $request->file('image_file');
        if ($uploaded) {
            $encoded = Base64ImageService::encode($uploaded);
            $data['image_data'] = $encoded['data'];
            $data['image_mime'] = $encoded['mime'];
        }

        $data = $this->preparePayload($data);
        if (! empty($data['slug'])) {
            $data['slug'] = $this->ensureUniqueSlug((string) $data['slug'], null);
        }
        $this->validateCategoryHierarchy($data);

        $categorie = CategorieProduit::create($data);

        if (!empty($data['image_data'])) {
            $categorie->update(['image_url' => url('/api/categories-produits/' . $categorie->id_categorie . '/image')]);
        }

        $this->bumpCache();

        return response()->json([
            'message' => 'Catégorie créée avec succès',
            'categorie' => $categorie->fresh()->load('parent'),
        ], 201);
    }

    /**
     * PUT /api/categories-produits/{id} (admin)
     */
    public function update(Request $request, $id)
    {
        $categorie = CategorieProduit::findOrFail($id);

        $data = $request->validate([
            'nom' => 'sometimes|string|max:255',
            // slug uniqueness is ensured after normalization (auto-suffix if needed)
            'slug' => ['nullable', 'string', 'max:160'],
            'description' => 'nullable|string',
            'icone' => 'nullable|string',
            'segment' => 'nullable|string|max:100',
            'image_url' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            'image_file' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            'parent_id' => 'nullable|uuid|exists:categories_produits,id_categorie',
            'ordre' => 'nullable|integer|min:0',
            'actif' => 'nullable|boolean',
        ]);

        $uploaded = $request->file('image') ?: $request->file('image_file');
        if ($uploaded) {
            $encoded = Base64ImageService::encode($uploaded);
            $data['image_data'] = $encoded['data'];
            $data['image_mime'] = $encoded['mime'];
            $data['image_url'] = url('/api/categories-produits/' . $categorie->id_categorie . '/image');
        }

        $data = $this->preparePayload($data, $categorie);
        if (! empty($data['slug'])) {
            $data['slug'] = $this->ensureUniqueSlug((string) $data['slug'], $categorie->id_categorie);
        }
        $this->validateCategoryHierarchy($data, $categorie);

        $categorie->update($data);

        $this->bumpCache();

        return response()->json([
            'message' => 'Catégorie mise à jour',
            'categorie' => $categorie->fresh()->load('parent'),
        ]);
    }

    /**
     * DELETE /api/categories-produits/{id} (admin)
     */
    public function destroy(Request $request, $id)
    {
        $categorie = CategorieProduit::findOrFail($id);
        $forceDeleteProducts = $request->boolean('force');

        if ($forceDeleteProducts) {
            $deletedProducts = 0;

            DB::transaction(function () use ($categorie, &$deletedProducts) {
                Produit::withTrashed()
                    ->where('id_categorie', $categorie->id_categorie)
                    ->chunkById(100, function ($products) use (&$deletedProducts) {
                        foreach ($products as $produit) {
                            $produit->forceDelete();
                            $deletedProducts += 1;
                        }
                    }, 'id_produit');

                $categorie->delete();
            });

            return response()->json([
                'message' => 'Categorie supprimee avec ses produits.',
                'deleted_products' => $deletedProducts,
            ]);
        }

        if ($categorie->produits()->exists()) {
            return response()->json([
                'message' => 'Cette categorie contient des produits. Utilisez force=1 pour supprimer categorie et produits.',
            ], 409);
        }

        if ($categorie->children()->exists()) {
            return response()->json([
                'message' => 'Cette categorie contient des sous-categories. Veuillez les supprimer ou les deplacer avant.',
            ], 409);
        }

        $categorie->delete();

        $this->bumpCache();

        return response()->json([
            'message' => 'Categorie supprimee',
        ]);
    }

    /**
     * POST /api/admin/categories-produits/bootstrap-ingenierie (admin)
     * Initialise / met à jour l'arborescence Ingénierie du catalogue général.
     */
    public function bootstrapIngenierie(Request $request): \Illuminate\Http\JsonResponse
    {
        $replace = (bool) $request->boolean('replace');

        $tree = [
            [
                'nom' => 'Catalogue Produits Techniques',
                'slug' => 'catalogue-produits-techniques',
                'description' => 'Racine du catalogue general des produits techniques.',
                'children' => [
                    [
                        'nom' => 'Ingenierie',
                        'slug' => 'ingenierie',
                        'description' => 'Branche qui regroupe les solutions TPE et drone.',
                        'children' => [
                            ['nom' => 'TPE', 'slug' => 'tpe', 'description' => 'Terminaux de paiement electronique.'],
                            ['nom' => 'Drone', 'slug' => 'drone', 'description' => 'Drones pour cartographie, surveillance et inspection.'],
                        ],
                    ],
                    [
                        'nom' => 'Archivage numérique',
                        'slug' => 'archivage-numerique',
                        'description' => 'Numerisation, conservation et gestion documentaire.',
                        'children' => [
                            ['nom' => 'Scanner documentaire', 'slug' => 'scanner-documentaire'],
                            ['nom' => 'Baie NAS', 'slug' => 'baie-nas'],
                            ['nom' => 'Serveur de sauvegarde', 'slug' => 'serveur-sauvegarde'],
                            ['nom' => 'Logiciel GED', 'slug' => 'logiciel-ged'],
                        ],
                    ],
                    [
                        'nom' => 'Matériel informatique',
                        'slug' => 'materiel-informatique',
                        'description' => 'Postes de travail, serveurs et impression.',
                        'children' => [
                            ['nom' => 'Ordinateur portable', 'slug' => 'ordinateur-portable'],
                            ['nom' => 'Ordinateur de bureau', 'slug' => 'ordinateur-bureau'],
                            ['nom' => 'Serveur rack', 'slug' => 'serveur-rack'],
                            ['nom' => 'Imprimante professionnelle', 'slug' => 'imprimante-professionnelle'],
                        ],
                    ],
                    [
                        'nom' => 'Réseau informatique',
                        'slug' => 'reseau-informatique',
                        'description' => 'Infrastructure LAN/WAN securisee.',
                        'children' => [
                            ['nom' => 'Switch manage', 'slug' => 'switch-manage'],
                            ['nom' => 'Routeur entreprise', 'slug' => 'routeur-entreprise'],
                            ['nom' => 'Point d\'acces Wi-Fi', 'slug' => 'point-acces-wifi'],
                            ['nom' => 'Pare-feu reseau', 'slug' => 'pare-feu-reseau'],
                        ],
                    ],
                    [
                        'nom' => 'Incendie',
                        'slug' => 'incendie',
                        'description' => 'Prevention, detection et alerte incendie.',
                        'children' => [
                            ['nom' => 'Extincteur', 'slug' => 'extincteur'],
                            ['nom' => 'R.I.A', 'slug' => 'ria'],
                            ['nom' => 'Detecteur de fumee', 'slug' => 'detecteur-fumee'],
                            ['nom' => 'Detecteur d\'humidite', 'slug' => 'detecteur-humidite'],
                            ['nom' => 'Sirene', 'slug' => 'sirene'],
                        ],
                    ],
                    [
                        'nom' => 'Energie',
                        'slug' => 'energie',
                        'description' => 'Continuite electrique via UPS, groupe et solaire.',
                        'children' => [
                            ['nom' => 'Onduleur', 'slug' => 'onduleur'],
                            ['nom' => 'Groupe electrique', 'slug' => 'groupe-electrique'],
                            ['nom' => 'Panneau solaire', 'slug' => 'panneau-solaire'],
                            ['nom' => 'Regulateur / convertisseur', 'slug' => 'regulateur-convertisseur'],
                        ],
                    ],
                    [
                        'nom' => 'Telecommunications',
                        'slug' => 'telecommunications',
                        'description' => 'Autocom, VoIP et equipements de communication d\'entreprise.',
                        'children' => [
                            ['nom' => 'Autocom', 'slug' => 'autocom'],
                            ['nom' => 'Telephone IP', 'slug' => 'telephone-ip'],
                            ['nom' => 'Passerelle VoIP', 'slug' => 'passerelle-voip'],
                            ['nom' => 'Routeur 4G/5G', 'slug' => 'routeur-4g-5g'],
                        ],
                    ],
                    [
                        'nom' => 'Securite informatique et base de donnees',
                        'slug' => 'securite-informatique-base-de-donnees',
                        'description' => 'Protection des postes, reseaux, SIEM et bases de donnees.',
                        'children' => [
                            ['nom' => 'Antivirus / EDR', 'slug' => 'antivirus-edr'],
                            ['nom' => 'SIEM / SOC', 'slug' => 'siem-soc'],
                            ['nom' => 'Sauvegarde base de donnees', 'slug' => 'sauvegarde-base-de-donnees'],
                            ['nom' => 'Pare-feu applicatif et BDD', 'slug' => 'pare-feu-applicatif-bdd'],
                        ],
                    ],
                ],
            ],
        ];

        $created = 0;
        $updated = 0;
        $deletedCategories = 0;
        $deletedProducts = 0;

        DB::transaction(function () use ($replace, $tree, &$created, &$updated, &$deletedCategories, &$deletedProducts) {
            if ($replace) {
                $managedSlugs = [
                    'catalogue-produits-techniques',
                    'ingenierie',
                    'archivage-numerique',
                    'materiel-informatique',
                    'reseau-informatique',
                    'incendie',
                    'telecommunications',
                    'securite-informatique-base-de-donnees',
                    'energie',
                ];

                $roots = CategorieProduit::query()
                    ->where('segment', 'general')
                    ->whereIn('slug', $managedSlugs)
                    ->get();

                if ($roots->isNotEmpty()) {
                    $all = CategorieProduit::query()
                        ->select(['id_categorie', 'parent_id'])
                        ->where('segment', 'general')
                        ->get();

                    $childrenByParent = [];
                    foreach ($all as $item) {
                        if ($item->parent_id) {
                            $childrenByParent[$item->parent_id][] = $item->id_categorie;
                        }
                    }

                    $ids = [];
                    $stack = $roots->pluck('id_categorie')->all();

                    while (! empty($stack)) {
                        $current = array_pop($stack);
                        if (in_array($current, $ids, true)) {
                            continue;
                        }

                        $ids[] = $current;
                        foreach ($childrenByParent[$current] ?? [] as $childId) {
                            $stack[] = $childId;
                        }
                    }

                    if (! empty($ids)) {
                        $deletedProducts = Produit::query()->whereIn('id_categorie', $ids)->delete();
                        $deletedCategories = CategorieProduit::query()->whereIn('id_categorie', $ids)->delete();
                    }
                }
            }

            $upsertNode = function (array $node, ?string $parentId = null, int $order = 0) use (&$upsertNode, &$created, &$updated) {
                $slug = $node['slug'] ?? Str::slug($node['nom']);

                $existing = CategorieProduit::query()->where('slug', $slug)->first();

                $payload = [
                    'nom' => $node['nom'],
                    'slug' => $slug,
                    'description' => $node['description'] ?? null,
                    'segment' => 'general',
                    'parent_id' => $parentId,
                    'ordre' => $order,
                    'actif' => true,
                ];

                if ($existing) {
                    $existing->update($payload);
                    $category = $existing;
                    $updated++;
                } else {
                    $category = CategorieProduit::query()->create($payload);
                    $created++;
                }

                foreach ($node['children'] ?? [] as $index => $child) {
                    $upsertNode($child, $category->id_categorie, $index + 1);
                }
            };

            foreach ($tree as $index => $rootNode) {
                $upsertNode($rootNode, null, $index + 1);
            }
        });

        $this->bumpCache();

        return response()->json([
            'message' => $replace
                ? 'Arborescence Produits recreee avec succes.'
                : 'Arborescence Produits synchronisee avec succes.',
            'data' => [
                'replace' => $replace,
                'deleted_products' => $deletedProducts,
                'deleted_categories' => $deletedCategories,
                'created' => $created,
                'updated' => $updated,
            ],
        ]);
    }

    /**
     * POST /api/admin/categories-produits/bootstrap-ingenierie-page (admin)
     * Synchronise les domaines de la page Ingénierie à partir d'un segment source,
     * sans suppression des données existantes.
     */
    public function bootstrapIngenieriePage(Request $request): \Illuminate\Http\JsonResponse
    {
        $sourceSegment = strtolower(trim((string) $request->input('source_segment', 'general')));
        $sourceRoots = collect();

        if ($sourceSegment === 'general') {
            $catalogRoot = CategorieProduit::query()
                ->where('segment', 'general')
                ->where('slug', 'catalogue-produits-techniques')
                ->first();

            if ($catalogRoot) {
                $sourceRoots = CategorieProduit::query()
                    ->where('segment', 'general')
                    ->where('parent_id', $catalogRoot->id_categorie)
                    ->with('children')
                    ->orderBy('ordre')
                    ->orderBy('nom')
                    ->get();
            }

            if ($sourceRoots->isEmpty()) {
                $sourceRoots = CategorieProduit::query()
                    ->where('segment', 'general')
                    ->whereNull('parent_id')
                    ->with('children')
                    ->orderBy('ordre')
                    ->orderBy('nom')
                    ->get();
            }
        } else {
            $sourceRoots = CategorieProduit::query()
                ->where('segment', $sourceSegment)
                ->whereNull('parent_id')
                ->with('children')
                ->orderBy('ordre')
                ->orderBy('nom')
                ->get();
        }

        if ($sourceRoots->isEmpty()) {
            return response()->json([
                'message' => 'Aucune categorie source trouvee pour synchroniser la page Ingenierie.',
                'data' => [
                    'source_segment' => $sourceSegment,
                    'created' => 0,
                    'updated' => 0,
                ],
            ], 422);
        }

        $created = 0;
        $updated = 0;

        DB::transaction(function () use ($sourceRoots, &$created, &$updated) {
            $upsertNode = function ($sourceNode, ?string $parentId = null, int $order = 0) use (&$upsertNode, &$created, &$updated) {
                $slug = Str::slug((string) ($sourceNode->slug ?: $sourceNode->nom));
                if ($slug === '') {
                    return;
                }

                $existing = CategorieProduit::query()
                    ->where('segment', 'ingenierie-page')
                    ->where('parent_id', $parentId)
                    ->whereRaw('LOWER(nom) = ?', [strtolower((string) $sourceNode->nom)])
                    ->first();

                if (! $existing) {
                    $existing = CategorieProduit::query()
                        ->where('segment', 'ingenierie-page')
                        ->where('slug', $slug)
                        ->first();
                }

                $resolvedSlug = $existing
                    ? (string) $existing->slug
                    : $this->ensureUniqueSlug($slug, null);

                $payload = [
                    'nom' => $sourceNode->nom,
                    'slug' => $resolvedSlug,
                    'description' => $sourceNode->description,
                    'segment' => 'ingenierie-page',
                    'parent_id' => $parentId,
                    'ordre' => $order,
                    'actif' => (bool) ($sourceNode->actif ?? true),
                    'image_url' => $sourceNode->image_url,
                    'image' => $sourceNode->image,
                    'icone' => $sourceNode->icone,
                ];

                if ($existing) {
                    $existing->update($payload);
                    $target = $existing;
                    $updated++;
                } else {
                    $target = CategorieProduit::query()->create($payload);
                    $created++;
                }

                $children = collect($sourceNode->children ?? []);
                foreach ($children as $index => $child) {
                    $upsertNode($child, $target->id_categorie, $index + 1);
                }
            };

            foreach ($sourceRoots as $index => $rootNode) {
                $upsertNode($rootNode, null, $index + 1);
            }
        });

        $this->bumpCache();

        return response()->json([
            'message' => 'Arborescence Ingenierie page synchronisee avec succes.',
            'data' => [
                'source_segment' => $sourceSegment,
                'created' => $created,
                'updated' => $updated,
            ],
        ]);
    }

    private function validateCategoryHierarchy(array $data, ?CategorieProduit $current = null): void
    {
        $segment = strtolower(trim((string) $this->resolveEffectiveSegment($data, $current)));
        $parentId = $this->resolveEffectiveParentId($data, $current);

        if (! $parentId) {
            return;
        }

        if ($current && $parentId === $current->id_categorie) {
            throw ValidationException::withMessages([
                'parent_id' => ['Une catégorie ne peut pas être son propre parent.'],
            ]);
        }

        $parent = CategorieProduit::query()
            ->select(['id_categorie', 'parent_id', 'segment'])
            ->find($parentId);

        if (! $parent) {
            return;
        }

        if ($current) {
            $this->assertNoHierarchyCycle($parentId, $current);
        }

        $parentSegment = strtolower(trim((string) ($parent->segment ?? '')));
        if ($segment !== '' && $parentSegment !== '' && $parentSegment !== $segment) {
            throw ValidationException::withMessages([
                'parent_id' => ['Le parent doit appartenir au même segment de catalogue.'],
            ]);
        }

        if ($segment === 'geovision') {
            if (! empty($parent->parent_id)) {
                throw ValidationException::withMessages([
                    'parent_id' => ['GeoVision utilise uniquement 2 niveaux: famille (parent) puis sous-catégorie.'],
                ]);
            }

            if ($current && $current->children()->exists()) {
                throw ValidationException::withMessages([
                    'parent_id' => ['Impossible de déplacer cette catégorie: elle contient déjà des sous-catégories.'],
                ]);
            }
        }
    }

    private function resolveEffectiveSegment(array $data, ?CategorieProduit $current = null): ?string
    {
        if (array_key_exists('segment', $data) && filled($data['segment'])) {
            return (string) $data['segment'];
        }

        if ($current) {
            return (string) $current->segment;
        }

        return null;
    }

    private function resolveEffectiveParentId(array $data, ?CategorieProduit $current = null): ?string
    {
        if (array_key_exists('parent_id', $data)) {
            return filled($data['parent_id']) ? $data['parent_id'] : null;
        }

        if ($current && filled($current->parent_id)) {
            return $current->parent_id;
        }

        return null;
    }

    private function assertNoHierarchyCycle(string $parentId, CategorieProduit $current): void
    {
        $ancestorId = $parentId;
        $guard = 0;

        while ($ancestorId !== null && $guard < 25) {
            if ($ancestorId === $current->id_categorie) {
                throw ValidationException::withMessages([
                    'parent_id' => ['Hiérarchie invalide: boucle détectée dans les parents.'],
                ]);
            }

            $ancestorId = CategorieProduit::query()
                ->where('id_categorie', $ancestorId)
                ->value('parent_id');

            $guard += 1;
        }
    }

    private function preparePayload(array $data, ?CategorieProduit $current = null): array
    {
        if (! empty($data['image_url'])) {
            $data['image'] = $data['image_url'];
        }

        if (array_key_exists('nom', $data) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['nom']);
        }

        if (array_key_exists('actif', $data)) {
            $data['actif'] = (bool) $data['actif'];
        }

        if (! empty($data['parent_id'])) {
            $parent = CategorieProduit::query()->find($data['parent_id']);
            if ($parent && empty($data['segment'])) {
                $data['segment'] = $parent->segment;
            }
        } elseif ($current && array_key_exists('parent_id', $data) && $data['parent_id'] === null && empty($data['segment'])) {
            $data['segment'] = $current->segment;
        }

        return $data;
    }

    private function deletePublicStoredImage(?string $imageUrl): void
    {
        $path = $this->publicStoragePathFromImageUrl($imageUrl);
        if (! $path) {
            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function publicStoragePathFromImageUrl(?string $imageUrl): ?string
    {
        $normalized = trim((string) ($imageUrl ?? ''));
        if ($normalized === '') {
            return null;
        }

        if (str_starts_with($normalized, 'http://') || str_starts_with($normalized, 'https://')) {
            $normalized = (string) (parse_url($normalized, PHP_URL_PATH) ?? '');
        }

        if (str_starts_with($normalized, '/storage/')) {
            return ltrim(substr($normalized, strlen('/storage/')), '/');
        }

        if (str_starts_with($normalized, 'storage/')) {
            return ltrim(substr($normalized, strlen('storage/')), '/');
        }

        return null;
    }

    private function ensureUniqueSlug(string $slug, ?string $ignoreId): string
    {
        $base = Str::slug($slug);
        $candidate = $base;
        $attempt = 0;

        while ($candidate !== '' && $attempt < self::SLUG_MAX_TRIES) {
            $query = CategorieProduit::query()->where('slug', $candidate);
            if ($ignoreId) {
                $query->where('id_categorie', '!=', $ignoreId);
            }

            if (! $query->exists()) {
                return $candidate;
            }

            $attempt += 1;
            $candidate = "{$base}-{$attempt}";
        }

        // Fallback: keep base (DB constraint may still reject, but prevents infinite loops)
        return $base !== '' ? $base : Str::random(10);
    }
}
