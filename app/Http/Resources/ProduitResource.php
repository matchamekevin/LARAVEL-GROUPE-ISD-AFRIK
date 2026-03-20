<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\CategorieProduitResource;

class ProduitResource extends JsonResource
{
    /**
     * Transforme le modèle Produit en tableau JSON.
     *
     * @param \Illuminate\Http\Request $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id_produit'    => $this->id_produit,
            'titre'         => $this->titre,
            'slug'          => $this->slug,
            'reference'     => $this->reference,
            'description'   => $this->description,
            'description_courte' => $this->description_courte,
            'prix'          => $this->prix,
            'prix_promo'    => $this->prix_promo,
            'promo_debut'   => $this->promo_debut?->toDateTimeString(),
            'promo_fin'     => $this->promo_fin?->toDateTimeString(),
            'statut'        => $this->statut,
            'stock'         => $this->stock,
            'stock_alerte'  => $this->stock_alerte,
            'marque'        => $this->marque,
            'modele'        => $this->modele,
            'poids'         => $this->poids,
            'garantie'      => $this->garantie,
            'specifications' => $this->specifications,
            'est_en_vedette'=> $this->est_en_vedette,
            'est_nouveau'   => $this->est_nouveau,
            'en_promo'      => $this->en_promo,
            'note_moyenne'  => $this->note_moyenne,
            'nombre_avis'   => $this->nombre_avis,
            'id_categorie'  => $this->id_categorie,

            // ✅ formatage correct de la date
            'date_creation' => $this->date_creation?->toDateTimeString(),

            // ✅ Relations
            'pays'          => new PaysResource($this->whenLoaded('pays')),
            'categorie'     => new CategorieProduitResource($this->whenLoaded('categorie')),
            'images'        => ImageResource::collection($this->whenLoaded('images')),
            'commentaires'  => CommentaireResource::collection($this->whenLoaded('commentaires')),
            'image_url'     => $this->images->first()?->url ?? '/images/default.webp',
        ];
    }
}