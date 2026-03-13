<?php

namespace App\Services;

use App\Models\Commentaire;

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
        return Commentaire::create($data);
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

        if (!empty($data['commentable_type'])) {
            $data['commentable_type'] = $this->mapType($data['commentable_type']);
        }

        $commentaire->update($data);
        return $commentaire->fresh();
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

        return (bool) $commentaire->delete();
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