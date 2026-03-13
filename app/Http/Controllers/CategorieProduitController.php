<?php

namespace App\Http\Controllers;

use App\Models\CategorieProduit;
use Illuminate\Http\Request;

class CategorieProduitController extends Controller
{
    /**
     * GET /api/categories-produits
     */
    public function index()
    {
        $categories = CategorieProduit::withCount('produits')->get();
        return response()->json($categories);
    }

    /**
     * GET /api/categories-produits/{id}
     */
    public function show($id)
    {
        $categorie = CategorieProduit::with(['produits.images'])->findOrFail($id);
        return response()->json($categorie);
    }

    /**
     * POST /api/categories-produits (admin)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nom'         => 'required|string|max:255',
            'description' => 'nullable|string',
            'segment'     => 'nullable|string|max:100',
            'image_url'   => 'nullable|string|max:255',
        ]);

        if (!empty($data['image_url']) && empty($data['image'])) {
            $data['image'] = $data['image_url'];
        }

        $categorie = CategorieProduit::create($data);

        return response()->json([
            'message'   => 'Catégorie créée avec succès',
            'categorie' => $categorie,
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
            'description' => 'nullable|string',
            'segment'     => 'nullable|string|max:100',
            'image_url'   => 'nullable|string|max:255',
        ]);

        if (!empty($data['image_url']) && empty($data['image'])) {
            $data['image'] = $data['image_url'];
        }

        $categorie->update($data);

        return response()->json([
            'message'   => 'Catégorie mise à jour',
            'categorie' => $categorie,
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
}
