<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\Request;

class ContactMessageController extends Controller
{
    /**
     * POST /api/contact-messages (public)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nom_complet' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'telephone' => 'nullable|string|max:30',
            'sujet' => 'nullable|string|max:255',
            'message' => 'required|string|min:10',
        ]);

        $contactMessage = ContactMessage::create([
            ...$data,
            'statut' => 'nouveau',
        ]);

        return response()->json([
            'message' => 'Message envoyé avec succès',
            'data' => $contactMessage,
        ], 201);
    }

    /**
     * GET /api/admin/contact-messages — Liste paginée
     */
    public function index(Request $request)
    {
        $perPage = max(1, min(50, (int) $request->query('per_page', 20)));
        $page = max(1, (int) $request->query('page', 1));
        $search = trim((string) $request->query('q', ''));
        $status = trim((string) $request->query('statut', ''));

        $query = ContactMessage::query()->orderByDesc('created_at');

        if ($search !== '') {
            $like = "%{$search}%";
            $query->where(function ($q) use ($like) {
                $q->where('nom_complet', 'ILIKE', $like)
                    ->orWhere('email', 'ILIKE', $like)
                    ->orWhere('sujet', 'ILIKE', $like)
                    ->orWhere('message', 'ILIKE', $like);
            });
        }

        if ($status !== '' && strtolower($status) !== 'all') {
            $query->where('statut', $status);
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page)->appends($request->query());

        $nouveau = ContactMessage::where('statut', 'nouveau')->count();
        $lu = ContactMessage::where('statut', 'lu')->count();
        $traite = ContactMessage::where('statut', 'traite')->count();

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
                'lu' => $lu,
                'traite' => $traite,
            ],
        ]);
    }

    /**
     * GET /api/admin/contact-messages/{id}
     */
    public function show(int $id)
    {
        $contactMessage = ContactMessage::find($id);

        if (!$contactMessage) {
            return response()->json(['message' => 'Message introuvable'], 404);
        }

        return response()->json($contactMessage);
    }

    /**
     * PATCH /api/admin/contact-messages/{id}/statut
     */
    public function updateStatus(Request $request, int $id)
    {
        $data = $request->validate([
            'statut' => 'required|string|in:nouveau,lu,en_cours,traite,archivé,archive',
        ]);

        $contactMessage = ContactMessage::find($id);

        if (!$contactMessage) {
            return response()->json(['message' => 'Message introuvable'], 404);
        }

        $contactMessage->statut = $data['statut'];
        $contactMessage->save();

        return response()->json([
            'message' => 'Statut du message mis à jour',
            'data' => $contactMessage,
        ]);
    }

    /**
     * DELETE /api/admin/contact-messages/{id}
     */
    public function destroy(int $id)
    {
        $contactMessage = ContactMessage::find($id);

        if (!$contactMessage) {
            return response()->json(['message' => 'Message introuvable'], 404);
        }

        $contactMessage->delete();

        return response()->json(['message' => 'Message supprimé']);
    }
}
