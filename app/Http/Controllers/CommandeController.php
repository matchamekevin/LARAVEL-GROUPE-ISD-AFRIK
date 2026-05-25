<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Commande;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CommandeController extends Controller
{
    private function resolveLigneCommandesTable(): ?string
    {
        if (Schema::hasTable('ligne_commandes')) {
            return 'ligne_commandes';
        }

        if (Schema::hasTable('lignes_commandes')) {
            return 'lignes_commandes';
        }

        return null;
    }

    private function fetchItemsByCommandeIds(array $commandeIds): array
    {
        $table = $this->resolveLigneCommandesTable();
        if (!$table || empty($commandeIds)) {
            return [];
        }

        $rows = DB::table($table . ' as lc')
            ->leftJoin('produits as p', 'p.id_produit', '=', 'lc.id_produit')
            ->leftJoin('categories_produits as c', 'c.id_categorie', '=', 'p.id_categorie')
            ->whereIn('lc.id_commande', $commandeIds)
            ->select([
                'lc.id_commande',
                'lc.id_ligne',
                'lc.id_produit',
                'lc.quantite',
                'lc.prix_unitaire',
                'lc.sous_total',
                'p.titre as produit_titre',
                'c.nom as categorie_nom',
                'c.segment as categorie_segment',
            ])
            ->orderBy('lc.id_ligne')
            ->get();

        $grouped = [];

        foreach ($rows as $row) {
            $segment = $row->categorie_segment ?: 'general';
            $source = $segment === 'geovision' ? 'geovision' : 'produits';

            $grouped[$row->id_commande][] = [
                'id_ligne' => $row->id_ligne,
                'id_produit' => $row->id_produit,
                'titre' => $row->produit_titre ?: 'Produit non renseigne',
                'categorie' => $row->categorie_nom,
                'segment' => $segment,
                'source' => $source,
                'quantite' => (int) ($row->quantite ?? 0),
                'prix_unitaire' => (float) ($row->prix_unitaire ?? 0),
                'sous_total' => (float) ($row->sous_total ?? 0),
            ];
        }

        return $grouped;
    }

    private function enrichCommandeForAdmin(Commande $commande, array $itemsByCommande): array
    {
        $items = $itemsByCommande[$commande->id_commande] ?? [];

        $latestPayment = collect($commande->paiements ?? [])
            ->sortByDesc(fn ($payment) => $payment->date_paiement ?? $payment->created_at)
            ->first();

        $sourceTypes = array_values(array_unique(array_map(
            fn ($item) => $item['source'] ?? 'produits',
            $items
        )));

        $resumePaiement = null;
        if ($latestPayment) {
            $resumePaiement = [
                'id_paiement' => $latestPayment->id_paiement,
                'reference' => $latestPayment->reference_transaction,
                'statut' => $latestPayment->statut_paiement,
                'montant' => (float) ($latestPayment->montant ?? 0),
                'date_paiement' => $latestPayment->date_paiement,
            ];
        }

        $detailsArticles = collect($items)
            ->map(function ($item) {
                $qty = $item['quantite'] > 0 ? 'x' . $item['quantite'] : '';
                return trim(($item['titre'] ?? 'Produit') . ' ' . $qty);
            })
            ->filter()
            ->values()
            ->all();

        $clientNomComplet = trim(($commande->utilisateur->prenom ?? '') . ' ' . ($commande->utilisateur->nom ?? ''));
        if ($clientNomComplet === '') {
            $clientNomComplet = $commande->utilisateur->email ?? 'Client inconnu';
        }

        return [
            'id' => $commande->id_commande,
            'id_commande' => $commande->id_commande,
            'numero_commande' => $commande->numero_commande,
            'date_commande' => $commande->date_commande,
            'statut' => $commande->statut,
            'type_commande' => $commande->type_commande,
            'montant_total' => (float) ($commande->montant_total ?? 0),
            'montant_commission' => $commande->montant_commission,
            'client_compte' => [
                'id_utilisateur' => $commande->utilisateur->id_utilisateur ?? null,
                'nom_complet' => $clientNomComplet,
                'email' => $commande->utilisateur->email ?? null,
                'telephone' => $commande->utilisateur->telephone ?? null,
            ],
            'articles_payes' => $items,
            'details_paiement' => $detailsArticles,
            'source_types' => $sourceTypes,
            'resume_paiement' => $resumePaiement,
            'paiements' => $commande->paiements,
            'factures' => $commande->factures,
            'livraison' => $commande->livraison,
            'livraison_statut' => $commande->livraison->statut ?? 'non_planifiee',
            'created_at' => $commande->created_at,
            'updated_at' => $commande->updated_at,
        ];
    }

    public function mesCommandes()
    {
        return response()->json([
            'message' => 'Cette route est prête. La logique sera ajoutée dans le module commandes.'
        ]);
    }

    /**
     * GET /api/admin/commandes — Liste paginée des commandes (admin)
     */
    public function adminIndex(Request $request)
    {
        $perPage = max(1, min(50, (int) $request->query('per_page', 20)));
        $page = max(1, (int) $request->query('page', 1));
        $search = trim((string) $request->query('q', ''));

        $query = Commande::with(['utilisateur', 'paiements', 'factures', 'livraison'])
            ->orderByDesc('date_commande');

        if ($search !== '') {
            $like = "%{$search}%";
            $query->where(function ($q) use ($like) {
                $q->where('numero_commande', 'ILIKE', $like)
                    ->orWhereHas('utilisateur', function ($uq) use ($like) {
                        $uq->where('email', 'ILIKE', $like)
                           ->orWhere('prenom', 'ILIKE', $like)
                           ->orWhere('nom', 'ILIKE', $like);
                    });
            });
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page)->appends($request->query());

        $items = collect($paginator->items());
        $ids = $items->pluck('id_commande')->all();
        $itemsByCommande = $this->fetchItemsByCommandeIds($ids);

        $payload = $items
            ->map(fn (Commande $commande) => $this->enrichCommandeForAdmin($commande, $itemsByCommande))
            ->values();

        $total = $paginator->total();
        $enAttente = Commande::whereIn('statut', ['en_attente', 'en_cours'])->count();
        $payee = Commande::whereIn('statut', ['payee', 'completed'])->count();

        return response()->json([
            'data' => $payload,
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
                'total' => $total,
                'en_attente' => $enAttente,
                'payee' => $payee,
            ],
        ]);
    }

    /**
     * GET /api/admin/commandes/{id} — Détail commande (admin)
     */
    public function adminShow(string $id)
    {
        $commande = Commande::with(['utilisateur', 'paiements', 'factures', 'livraison'])
            ->find($id);

        if (!$commande) {
            return response()->json(['message' => 'Commande introuvable'], 404);
        }

        $itemsByCommande = $this->fetchItemsByCommandeIds([$commande->id_commande]);

        return response()->json($this->enrichCommandeForAdmin($commande, $itemsByCommande));
    }

    /**
     * PATCH /api/admin/commandes/{id}/statut — MAJ statut (admin)
     */
    public function adminUpdateStatus(Request $request, string $id)
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

    /**
     * PATCH /api/admin/commandes/{id}/livraison-statut — MAJ statut livraison (admin)
     */
    public function adminUpdateLivraisonStatus(Request $request, string $id)
    {
        $data = $request->validate([
            'statut' => 'required|string|in:en_attente,en_preparation,expediee,en_livraison,livree,echec,retournee',
        ]);

        $commande = Commande::with('livraison')->find($id);

        if (!$commande) {
            return response()->json(['message' => 'Commande introuvable'], 404);
        }

        if (!$commande->livraison) {
            return response()->json(['message' => 'Aucune livraison associee a cette commande'], 422);
        }

        $commande->livraison->statut = $data['statut'];
        $commande->livraison->save();

        return response()->json([
            'message' => 'Statut de livraison mis a jour',
            'data' => $commande->livraison,
        ]);
    }
}