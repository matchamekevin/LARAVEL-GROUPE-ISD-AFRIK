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
