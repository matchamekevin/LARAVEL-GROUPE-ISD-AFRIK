<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\CategorieProduitResource;

class ProduitResource extends JsonResource
{
    private function extractStoragePath(string $url): ?string
    {
        if (str_starts_with($url, '/storage/')) {
            $path = ltrim(substr($url, strlen('/storage/')), '/');
            return $path !== '' ? $path : null;
        }

        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            $parsedPath = parse_url($url, PHP_URL_PATH);
            if (is_string($parsedPath) && str_starts_with($parsedPath, '/storage/')) {
                $path = ltrim(substr($parsedPath, strlen('/storage/')), '/');
                return $path !== '' ? $path : null;
            }
            return null;
        }

        if (!str_starts_with($url, '/')) {
            $path = ltrim($url, '/');
            return $path !== '' ? $path : null;
        }

        return null;
    }

    private function normalizeImageUrl(?string $value): ?string
    {
        $url = trim((string) ($value ?? ''));
        if ($url === '') {
            return null;
        }

        if (str_contains($url, '127.0.0.1') || str_contains($url, 'localhost')) {
            $parsedPath = parse_url($url, PHP_URL_PATH);
            if (is_string($parsedPath)) {
                $url = $parsedPath;
            } else {
                return null;
            }
        }

        $storagePath = $this->extractStoragePath($url);
        if ($storagePath !== null) {
            return '/storage/' . ltrim($storagePath, '/');
        }

        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://') || str_starts_with($url, '/')) {
            return $url;
        }

        return null;
    }

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
            'id_pays'       => $this->id_pays,
            'id_utilisateur'=> $this->id_utilisateur,

            // ✅ formatage correct de la date
            'date_creation' => $this->date_creation?->toDateTimeString(),
            'deleted_at'    => $this->deleted_at?->toDateTimeString(),

            // ✅ Relations
            'pays'          => new PaysResource($this->whenLoaded('pays')),
            'categorie'     => new CategorieProduitResource($this->whenLoaded('categorie')),
            'images'        => ImageResource::collection($this->whenLoaded('images')),
            'commentaires'  => CommentaireResource::collection($this->whenLoaded('commentaires')),
            'image_url'     => $this->normalizeImageUrl($this->images->first()?->image_url ?? $this->images->first()?->url ?? $this->images->first()?->path),
            'image_urls'    => $this->whenLoaded('images', fn () => $this->images
                ->map(fn ($image) => $this->normalizeImageUrl($image->image_url ?? $image->url ?? $image->path))
                ->filter()
                ->values()),
            'segment'       => $this->segment ?? $this->categorie?->segment,
        ];
    }
}
