<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\ProduitResource;
use App\Http\Resources\FormationResource;

/**
 * PaysResource
 * Transforme un modèle Pays en sortie JSON propre.
 */
class PaysResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'      => $this->id_pays,
            'nom'     => $this->nom_pays,
            'code'    => $this->code_pays,
            'devise'  => $this->devise_locale,
            'langue'  => $this->langue_principale,

            // Relations (chargées uniquement si elles sont disponibles)
            'produits'   => $this->when(
                $this->relationLoaded('produits'),
                fn () => ProduitResource::collection($this->produits)
            ),
            'formations' => $this->when(
                $this->relationLoaded('formations'),
                fn () => FormationResource::collection($this->formations)
            ),
        ];
    }
}