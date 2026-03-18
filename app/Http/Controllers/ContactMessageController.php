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
     * GET /api/admin/contact-messages
     */
    public function index()
    {
        return response()->json(
            ContactMessage::query()->latest()->get()
        );
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
