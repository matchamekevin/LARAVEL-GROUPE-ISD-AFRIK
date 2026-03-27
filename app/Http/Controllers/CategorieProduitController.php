<?php

namespace App\Http\Controllers;

use App\Models\CategorieProduit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

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
    public function bootstrapIngenierie(): \Illuminate\Http\JsonResponse
    {
        $tree = [
            [
                'nom' => 'Ingénierie',
                'slug' => 'ingenierie',
                'description' => 'Famille principale des prestations et produits techniques.',
                'children' => [
                    [
                        'nom' => 'Drone',
                        'slug' => 'drone',
                        'children' => [
                            ['nom' => 'Drone de cartographie'],
                            ['nom' => 'Drone de surveillance'],
                            ['nom' => 'Drone agricole'],
                        ],
                    ],
                    [
                        'nom' => 'TPE',
                        'slug' => 'tpe',
                        'children' => [
                            ['nom' => 'TPE mobile'],
                            ['nom' => 'TPE fixe'],
                            ['nom' => 'TPE Android'],
                        ],
                    ],
                    [
                        'nom' => 'Archivage numérique',
                        'slug' => 'archivage-numerique',
                        'children' => [
                            ['nom' => 'Scanner documentaire'],
                            ['nom' => 'Serveur de stockage'],
                            ['nom' => 'Logiciel GED'],
                        ],
                    ],
                    [
                        'nom' => 'Matériel informatique',
                        'slug' => 'materiel-informatique',
                        'children' => [
                            ['nom' => 'Ordinateur portable'],
                            ['nom' => 'Ordinateur bureau'],
                            ['nom' => 'Serveur rack'],
                            ['nom' => 'Imprimante professionnelle'],
                        ],
                    ],
                    [
                        'nom' => 'Réseau informatique',
                        'slug' => 'reseau-informatique',
                        'children' => [
                            ['nom' => 'Switch managé'],
                            ['nom' => 'Routeur entreprise'],
                            ['nom' => 'Point d\'accès Wi-Fi'],
                            ['nom' => 'Firewall'],
                        ],
                    ],
                    [
                        'nom' => 'Incendie',
                        'slug' => 'incendie',
                        'children' => [
                            ['nom' => 'Extincteur'],
                            ['nom' => 'R.I.A'],
                            ['nom' => 'Détecteur de fumée'],
                            ['nom' => 'Détecteur d\'humidité'],
                            ['nom' => 'Sirène'],
                        ],
                    ],
                    [
                        'nom' => 'Énergie',
                        'slug' => 'energie',
                        'children' => [
                            ['nom' => 'Onduleur'],
                            ['nom' => 'Groupe électrogène'],
                            ['nom' => 'Panneau solaire'],
                        ],
                    ],
                    [
                        'nom' => 'Télécommunications',
                        'slug' => 'telecommunications',
                        'children' => [
                            ['nom' => 'Autocom'],
                            ['nom' => 'Téléphone IP'],
                            ['nom' => 'Passerelle VoIP'],
                            ['nom' => 'Antenne radio'],
                        ],
                    ],
                    [
                        'nom' => 'Sécurité informatique et base de données',
                        'slug' => 'securite-informatique-base-de-donnees',
                        'children' => [
                            ['nom' => 'Antivirus entreprise'],
                            ['nom' => 'Pare-feu applicatif'],
                            ['nom' => 'Sauvegarde base de données'],
                            ['nom' => 'Audit sécurité'],
                        ],
                    ],
                ],
            ],
        ];

        $created = 0;
        $updated = 0;

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

        return response()->json([
            'message' => 'Arborescence Ingénierie initialisée avec succès.',
            'data' => [
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
