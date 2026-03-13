<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Services\FormationService;
use Illuminate\Http\Request;

class FormationController extends Controller
{
    protected $formationService;

    public function __construct(FormationService $formationService)
    {
        $this->formationService = $formationService;
    }

    /** Liste toutes les formations */
    public function index()
    {
        return response()->json(Formation::all(), 200);
    }

    /** Affiche une formation précise */
    public function show($id)
    {
        $formation = Formation::findOrFail($id);
        return response()->json($formation, 200);
    }

    /** Crée une nouvelle formation */
    public function store(Request $request)
    {
        $data = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'required|string',
            'duree' => 'required|integer',
            'prix' => 'required|numeric',
            'categorie' => 'required|string',
            'date_debut' => 'required|date',
            'places_disponibles' => 'required|integer',
            'id_pays' => 'required|exists:pays,id_pays',
        ]);

        $formation = $this->formationService->createFormation($data);

        return response()->json($formation, 201);
    }

    /** Met à jour une formation */
    public function update(Request $request, $id)
    {
        $data = $request->all();
        $formation = $this->formationService->updateFormation($id, $data);

        return response()->json($formation, 200);
    }

    /** Supprime une formation */
    public function destroy($id)
    {
        $this->formationService->deleteFormation($id);
        return response()->json(['message' => 'Formation supprimée'], 200);
    }
}
