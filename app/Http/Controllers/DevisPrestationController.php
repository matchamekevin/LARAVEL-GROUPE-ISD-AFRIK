<?php

namespace App\Http\Controllers;

use App\Models\DevisPrestation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class DevisPrestationController extends Controller
{
    /**
     * POST /api/devis-prestation (public)
     * Store a new devis prestation request and send email
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'prestation_slug' => 'required|string|max:255',
            'prestation_name' => 'required|string|max:255',
            'services' => 'nullable|array',
            'technologies' => 'nullable|array',
        ]);

        // Save to database
        $devisPrestation = DevisPrestation::create([
            'prestation_slug' => $data['prestation_slug'],
            'prestation_name' => $data['prestation_name'],
            'services' => $data['services'] ?? [],
            'technologies' => $data['technologies'] ?? [],
            'statut' => 'nouveau',
        ]);

        // Send email with selected services/technologies
        try {
            $this->sendDevisEmail($data);
        } catch (\Exception $e) {
            // Log error but don't fail the API call
            \Log::error('Error sending devis email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Devis enregistré et envoyé avec succès',
            'data' => $devisPrestation,
        ], 201);
    }

    /**
     * Send devis email with selected services/technologies
     */
    private function sendDevisEmail(array $data)
    {
        $to = 'matchamegnatikevin894@gmail.com';
        $subject = "Demande de devis - {$data['prestation_name']}";
        
        $services = !empty($data['services']) ? implode(', ', $data['services']) : 'Aucun service sélectionné';
        $technologies = !empty($data['technologies']) ? implode(', ', $data['technologies']) : 'Aucune technologie sélectionnée';

        $message = "
Nouvelle demande de devis reçue:

Prestation: {$data['prestation_name']}
Slug: {$data['prestation_slug']}

Services sélectionnés:
{$services}

Technologies sélectionnées:
{$technologies}

Date/Heure: " . now()->format('d/m/Y H:i:s') . "

---
Ce message a été généré automatiquement par la plateforme Groupe ISD AFRIK.
        ";

        Mail::raw($message, function ($mail) use ($to, $subject) {
            $mail->to($to)->subject($subject);
        });
    }

    /**
     * GET /api/admin/devis-prestations — Paginated list
     */
    public function index(Request $request)
    {
        $perPage = max(1, min(50, (int) $request->query('per_page', 20)));
        $page = max(1, (int) $request->query('page', 1));
        $search = trim((string) $request->query('q', ''));
        $status = trim((string) $request->query('statut', ''));

        $query = DevisPrestation::query()->orderByDesc('created_at');

        if ($search !== '') {
            $like = "%{$search}%";
            $query->where(function ($q) use ($like) {
                $q->where('prestation_name', 'ILIKE', $like)
                    ->orWhere('prestation_slug', 'ILIKE', $like);
            });
        }

        if ($status !== '' && strtolower($status) !== 'all') {
            $query->where('statut', $status);
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page)->appends($request->query());

        $nouveau = DevisPrestation::where('statut', 'nouveau')->count();
        $traite = DevisPrestation::where('statut', 'traite')->count();

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
                'traite' => $traite,
            ],
        ]);
    }

    /**
     * GET /api/admin/devis-prestations/{id}
     */
    public function show(int $id)
    {
        $devisPrestation = DevisPrestation::find($id);

        if (!$devisPrestation) {
            return response()->json(['message' => 'Devis prestation introuvable'], 404);
        }

        return response()->json($devisPrestation);
    }

    /**
     * PATCH /api/admin/devis-prestations/{id}/statut
     */
    public function updateStatus(Request $request, int $id)
    {
        $data = $request->validate([
            'statut' => 'required|string|in:nouveau,traite',
        ]);

        $devisPrestation = DevisPrestation::find($id);

        if (!$devisPrestation) {
            return response()->json(['message' => 'Devis prestation introuvable'], 404);
        }

        $devisPrestation->statut = $data['statut'];
        $devisPrestation->save();

        return response()->json([
            'message' => 'Statut mis à jour',
            'data' => $devisPrestation,
        ]);
    }

    /**
     * DELETE /api/admin/devis-prestations/{id}
     */
    public function destroy(int $id)
    {
        $devisPrestation = DevisPrestation::find($id);

        if (!$devisPrestation) {
            return response()->json(['message' => 'Devis prestation introuvable'], 404);
        }

        $devisPrestation->delete();

        return response()->json(['message' => 'Devis prestation supprimé']);
    }
}
