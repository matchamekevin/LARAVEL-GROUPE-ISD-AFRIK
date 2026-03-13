<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CommandeController extends Controller
{
    public function mesCommandes()
    {
        return response()->json([
            'message' => 'Cette route est prête. La logique sera ajoutée dans le module commandes.'
        ]);
    }

    /**
     * GET /api/admin/commandes — Liste toutes les commandes (admin)
     */
    public function adminIndex()
    {
        $commandes = \App\Models\Commande::with(['utilisateur'])
            ->orderByDesc('date_commande')
            ->get();

        return response()->json($commandes);
    }
}