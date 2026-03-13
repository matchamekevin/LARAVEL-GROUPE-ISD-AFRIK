<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CommentaireResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id_commentaire'   => $this->id_commentaire,
            'contenu'          => $this->contenu,
            'note'             => $this->note,
            // formatage correct grâce au cast en datetime
            'date'             => $this->date?->format('Y-m-d'),
            'commentable_type' => $this->commentable_type,
            'commentable_id'   => $this->commentable_id,
            'commentable'      => [
                'titre' => $this->commentable?->titre ?? null,
            ],
            'utilisateur'      => [
                'id'   => $this->utilisateur?->id_utilisateur,
                'nom'  => $this->utilisateur?->nom,
            ],
            'created_at'       => $this->created_at?->toDateTimeString(),
            'updated_at'       => $this->updated_at?->toDateTimeString(),
        ];
    }
}