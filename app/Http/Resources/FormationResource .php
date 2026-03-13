<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class FormationResource extends JsonResource
{
    /**
     * Transforme la ressource Formation en tableau JSON.
     */
    public function toArray($request)
    {
        return [
            'id_formation' => $this->id_formation,
            'titre' => $this->titre,
            'description' => $this->description,
            'duree' => $this->duree,
            'prix' => $this->prix,
            'categorie' => $this->categorie,
            'date_debut' => $this->date_debut,
            'places_disponibles' => $this->places_disponibles,
            'pays' => new PaysResource($this->whenLoaded('pays')),
            'images' => ImageResource::collection($this->whenLoaded('images')),
            'commentaires' => CommentaireResource::collection($this->whenLoaded('commentaires')),
        ];
    }
}