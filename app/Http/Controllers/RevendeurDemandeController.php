<?php

namespace App\Http\Controllers;

use App\Models\RevendeurDemande;
use Illuminate\Http\Request;

class RevendeurDemandeController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_entreprise' => 'required|string|max:255',
            'statut_juridique' => 'nullable|string|max:100',
            'rccm' => 'nullable|string|max:255',
            'identifiant_fiscal' => 'nullable|string|max:255',
            'annee_creation' => 'nullable|string|max:20',
            'adresse_siege' => 'nullable|string|max:255',
            'pays' => 'required|string|max:100',
            'ville' => 'nullable|string|max:100',
            'telephone' => 'required|string|max:30',
            'email_professionnel' => 'required|email|max:255',
            'site_web' => 'nullable|string|max:255',
            'representant_nom' => 'required|string|max:255',
            'representant_fonction' => 'nullable|string|max:150',
            'representant_telephone' => 'nullable|string|max:30',
            'representant_email' => 'nullable|email|max:255',
            'zone_couverture' => 'nullable|string',
            'experience_annees' => 'nullable|string|max:50',
            'marques_distribuees' => 'nullable|string',
            'motivation' => 'required|string|min:20',
            'equipe_commerciale' => 'nullable|boolean',
            'equipe_technique' => 'nullable|boolean',
            'showroom' => 'nullable|boolean',
            'service_installation_maintenance' => 'nullable|boolean',
            'activites' => 'nullable|array',
            'activites.*' => 'string|max:255',
            'documents' => 'nullable|array',
            'documents.*' => 'string|max:255',
        ]);

        $demande = RevendeurDemande::create($validated);

        return response()->json([
            'message' => 'Votre demande revendeur a ete enregistree avec succes.',
            'id' => $demande->id,
        ], 201);
    }
}
