<?php

namespace App\Services;

use App\Models\Commentaire;
use App\Models\Produit;

class CommentaireService
{
    /**
     * Récupérer tous les commentaires (triés par date de création).
     */
    public function all()
    {
        return Commentaire::with(['utilisateur', 'commentable'])
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Créer un nouveau commentaire.
     */
    public function create(array $data): Commentaire
    {
        // Forcer le type à respecter la contrainte SQL
        $data['commentable_type'] = $this->mapType($data['commentable_type']);
        $commentaire = Commentaire::create($data);
        $this->refreshProductRating($commentaire->commentable_type, (int) $commentaire->commentable_id);

        return $commentaire;
    }

    /**
     * Trouver un commentaire par son ID.
     */
    public function find(int $id): ?Commentaire
    {
        return Commentaire::with(['utilisateur', 'commentable'])->find($id);
    }

    /**
     * Mettre à jour un commentaire existant.
     */
    public function update(int $id, array $data): ?Commentaire
    {
        $commentaire = Commentaire::find($id);
        if (!$commentaire) {
            return null;
        }

        $oldType = (string) $commentaire->commentable_type;
        $oldId = (int) $commentaire->commentable_id;

        if (!empty($data['commentable_type'])) {
            $data['commentable_type'] = $this->mapType($data['commentable_type']);
        }

        $commentaire->update($data);
        $fresh = $commentaire->fresh();

        $this->refreshProductRating($oldType, $oldId);
        $this->refreshProductRating((string) $fresh->commentable_type, (int) $fresh->commentable_id);

        return $fresh;
    }

    /**
     * Supprimer un commentaire.
     */
    public function delete(int $id): bool
    {
        $commentaire = Commentaire::find($id);
        if (!$commentaire) {
            return false;
        }

        $type = (string) $commentaire->commentable_type;
        $targetId = (int) $commentaire->commentable_id;

        $deleted = (bool) $commentaire->delete();
        if ($deleted) {
            $this->refreshProductRating($type, $targetId);
        }

        return $deleted;
    }

    private function refreshProductRating(string $commentableType, int $commentableId): void
    {
        if (strtoupper($commentableType) !== 'PRODUIT' || $commentableId <= 0) {
            return;
        }

        $produit = Produit::find($commentableId);
        if ($produit) {
            $produit->recalculerNote();
        }
    }

    /**
     * Convertit un type simplifié (PRODUIT, FORMATION, BLOG)
     * en valeur acceptée par la contrainte SQL.
     */
    private function mapType(string $type): string
    {
        switch (strtoupper($type)) {
            case 'PRODUIT':
                return 'PRODUIT';
            case 'FORMATION':
                return 'FORMATION';
            case 'BLOG':
                return 'BLOG';
            default:
                // Sécurité : renvoie la valeur brute en majuscules
                return strtoupper($type);
        }
    }
}