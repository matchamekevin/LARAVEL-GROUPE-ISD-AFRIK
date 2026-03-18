<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Commande;

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
        $commandes = Commande::with(['utilisateur'])
            ->orderByDesc('date_commande')
            ->get();

        return response()->json($commandes);
    }

    /**
     * GET /api/admin/commandes/{id} — Détail commande (admin)
     */
    public function adminShow(int $id)
    {
        $commande = Commande::with(['utilisateur', 'paiements', 'factures', 'livraison'])
            ->find($id);

        if (!$commande) {
            return response()->json(['message' => 'Commande introuvable'], 404);
        }

        return response()->json($commande);
    }

    /**
     * PATCH /api/admin/commandes/{id}/statut — MAJ statut (admin)
     */
    public function adminUpdateStatus(Request $request, int $id)
    {
        $data = $request->validate([
            'statut' => 'required|string|in:en_attente,payee,payée,annulee,annulée,en_cours,livree,livrée',
        ]);

        $commande = Commande::find($id);

        if (!$commande) {
            return response()->json(['message' => 'Commande introuvable'], 404);
        }

        $commande->statut = $data['statut'];
        $commande->save();

        return response()->json([
            'message' => 'Statut commande mis à jour',
            'data' => $commande,
        ]);
    }
}