<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CategorieProduitResource extends JsonResource
{
    /**
     * Transforme la categorie en tableau JSON.
     *
     * @param \Illuminate\Http\Request $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id_categorie' => $this->id_categorie,
            'nom'          => $this->nom,
            'description'  => $this->description,
            'segment'      => $this->segment,
            'image_url'    => $this->image_url,
        ];
    }
}
