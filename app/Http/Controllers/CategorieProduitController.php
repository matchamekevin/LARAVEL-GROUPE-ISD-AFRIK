<?php

namespace App\Http\Controllers;

use App\Models\CategorieProduit;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class CategorieProduitController extends Controller
{
    /**
     * GET /api/categories-produits
     */
    public function index(Request $request)
    {
        $query = CategorieProduit::query()
            ->withCount('produits')
            ->with('parent')
            ->orderBy('ordre')
            ->orderBy('nom');

        if ($request->filled('segment')) {
            $query->where('segment', $request->query('segment'));
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
            $query->with('produits.images');
        }

        return response()->json($query->get());
    }

    /**
     * GET /api/categories-produits/{id}
     */
    public function show(Request $request, $id)
    {
        $query = CategorieProduit::query()
            ->withCount('produits')
            ->with(['parent.parent']);

        if ($request->boolean('tree')) {
            $query->with('childrenRecursive');
        } else {
            $query->with('children');
        }

        if ($request->boolean('with_products')) {
            $query->with('produits.images');
        }

        $categorie = $query->findOrFail($id);

        return response()->json($categorie);
    }

    /**
     * GET /api/categories-produits/slug/{slug}
     */
    public function showBySlug(Request $request, string $slug)
    {
        $query = CategorieProduit::query()
            ->withCount('produits')
            ->with(['parent.parent']);

        if ($request->boolean('tree')) {
            $query->with('childrenRecursive');
        } else {
            $query->with('children');
        }

        if ($request->boolean('with_products')) {
            $query->with('produits.images');
        }

        $categorie = $query->where('slug', $slug)->firstOrFail();

        return response()->json($categorie);
    }

    /**
     * POST /api/categories-produits (admin)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nom'         => 'required|string|max:255',
            'slug'        => 'nullable|string|max:160|unique:categories_produits,slug',
            'description' => 'nullable|string',
            'segment'     => 'nullable|string|max:100',
            'image_url'   => 'nullable|string|max:255',
            'image'       => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            'parent_id'   => 'nullable|integer|exists:categories_produits,id_categorie',
            'ordre'       => 'nullable|integer|min:0',
            'actif'       => 'nullable|boolean',
        ]);

        if ($request->hasFile('image')) {
            $storedPath = $request->file('image')->store('geovision-categories', 'public');
            $data['image_url'] = Storage::disk('public')->url($storedPath);
        }

        $data = $this->preparePayload($data);

        $categorie = CategorieProduit::create($data);

        return response()->json([
            'message'   => 'Catégorie créée avec succès',
            'categorie' => $categorie->load('parent'),
        ], 201);
    }

    /**
     * PUT /api/categories-produits/{id} (admin)
     */
    public function update(Request $request, $id)
    {
        $categorie = CategorieProduit::findOrFail($id);

        $data = $request->validate([
            'nom'         => 'sometimes|string|max:255',
            'slug'        => ['nullable', 'string', 'max:160', Rule::unique('categories_produits', 'slug')->ignore($categorie->id_categorie, 'id_categorie')],
            'description' => 'nullable|string',
            'segment'     => 'nullable|string|max:100',
            'image_url'   => 'nullable|string|max:255',
            'image'       => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            'parent_id'   => 'nullable|integer|exists:categories_produits,id_categorie',
            'ordre'       => 'nullable|integer|min:0',
            'actif'       => 'nullable|boolean',
        ]);

        if ($request->hasFile('image')) {
            $storedPath = $request->file('image')->store('geovision-categories', 'public');
            $data['image_url'] = Storage::disk('public')->url($storedPath);
        }

        $data = $this->preparePayload($data, $categorie);

        $categorie->update($data);

        return response()->json([
            'message'   => 'Catégorie mise à jour',
            'categorie' => $categorie->fresh()->load('parent'),
        ]);
    }

    /**
     * DELETE /api/categories-produits/{id} (admin)
     */
    public function destroy($id)
    {
        $categorie = CategorieProduit::findOrFail($id);
        $categorie->delete();

        return response()->json([
            'message' => 'Catégorie supprimée',
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
                            $childrenByParent[(int) $item->parent_id][] = (int) $item->id_categorie;
                        }
                    }

                    $ids = [];
                    $stack = $roots->pluck('id_categorie')->map(fn ($id) => (int) $id)->all();

                    while (!empty($stack)) {
                        $current = array_pop($stack);
                        if (in_array($current, $ids, true)) {
                            continue;
                        }

                        $ids[] = $current;
                        foreach ($childrenByParent[$current] ?? [] as $childId) {
                            $stack[] = $childId;
                        }
                    }

                    if (!empty($ids)) {
                        $deletedProducts = Produit::query()->whereIn('id_categorie', $ids)->delete();
                        $deletedCategories = CategorieProduit::query()->whereIn('id_categorie', $ids)->delete();
                    }
                }
            }

            $upsertNode = function (array $node, ?int $parentId = null, int $order = 0) use (&$upsertNode, &$created, &$updated) {
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
                    $upsertNode($child, (int) $category->id_categorie, $index + 1);
                }
            };

            foreach ($tree as $index => $rootNode) {
                $upsertNode($rootNode, null, $index + 1);
            }
        });

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

    private function preparePayload(array $data, ?CategorieProduit $current = null): array
    {
        if (!empty($data['image_url'])) {
            $data['image'] = $data['image_url'];
        }

        if (array_key_exists('nom', $data) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['nom']);
        }

        if (array_key_exists('actif', $data)) {
            $data['actif'] = (bool) $data['actif'];
        }

        if (!empty($data['parent_id'])) {
            $parent = CategorieProduit::query()->find($data['parent_id']);
            if ($parent && empty($data['segment'])) {
                $data['segment'] = $parent->segment;
            }
        } elseif ($current && array_key_exists('parent_id', $data) && $data['parent_id'] === null && empty($data['segment'])) {
            $data['segment'] = $current->segment;
        }

        return $data;
    }
}
