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
            'slug'         => $this->slug,
            'description'  => $this->description,
            'segment'      => $this->segment,
            'parent_id'    => $this->parent_id,
            'ordre'        => $this->ordre,
            'display_mode' => $this->display_mode,
            'actif'        => $this->actif,
            'image_url'    => $this->image_url,
            'image'        => $this->image,
            'produits_count' => $this->whenCounted('produits'),
            'parent'       => new self($this->whenLoaded('parent')),
            'children'     => self::collection($this->whenLoaded('children')),
            'children_recursive' => self::collection($this->whenLoaded('childrenRecursive')),
        ];
    }
}
