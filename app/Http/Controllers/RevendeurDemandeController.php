<?php

namespace App\Http\Controllers;

use App\Models\RevendeurDemande;
use Illuminate\Http\Request;

class RevendeurDemandeController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min(50, (int) $request->query('per_page', 20)));
        $page = max(1, (int) $request->query('page', 1));
        $search = trim((string) $request->query('q', ''));
        $status = trim((string) $request->query('statut', ''));

        $query = RevendeurDemande::query()->orderByDesc('created_at');

        if ($search !== '') {
            $like = "%{$search}%";
            $query->where(function ($q) use ($like) {
                $q->where('nom_entreprise', 'ILIKE', $like)
                    ->orWhere('email_professionnel', 'ILIKE', $like)
                    ->orWhere('representant_nom', 'ILIKE', $like)
                    ->orWhere('pays', 'ILIKE', $like);
            });
        }

        if ($status !== '' && strtolower($status) !== 'all') {
            $query->where('statut', $status);
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page)->appends($request->query());

        $nouveau = RevendeurDemande::where('statut', 'nouveau')->count();
        $en_cours = RevendeurDemande::where('statut', 'en_cours')->count();
        $valide = RevendeurDemande::where('statut', 'valide')->count();
        $rejete = RevendeurDemande::where('statut', 'rejete')->count();

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'links' => [
                'first' => $paginator->url(1),
                'last' => $paginator->url($paginator->lastPage()),
                'next' => $paginator->nextPageUrl(),
                'prev' => $paginator->previousPageUrl(),
            ],
            'stats' => [
                'total' => $paginator->total(),
                'nouveau' => $nouveau,
                'en_cours' => $en_cours,
                'valide' => $valide,
                'rejete' => $rejete,
            ],
        ]);
    }

    public function show(int $id)
    {
        $demande = RevendeurDemande::find($id);

        if (!$demande) {
            return response()->json(['message' => 'Demande introuvable'], 404);
        }

        return response()->json($demande);
    }

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

    public function updateStatus(Request $request, int $id)
    {
        $data = $request->validate([
            'statut' => 'required|string|max:40',
        ]);

        $demande = RevendeurDemande::find($id);

        if (!$demande) {
            return response()->json(['message' => 'Demande introuvable'], 404);
        }

        $demande->statut = $data['statut'];
        $demande->save();

        return response()->json([
            'message' => 'Statut mis à jour',
            'data' => $demande,
        ]);
    }

    public function destroy(int $id)
    {
        $demande = RevendeurDemande::find($id);

        if (!$demande) {
            return response()->json(['message' => 'Demande introuvable'], 404);
        }

        $demande->delete();

        return response()->json(['message' => 'Demande supprimée']);
    }
}
