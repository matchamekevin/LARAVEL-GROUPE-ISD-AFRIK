<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CategorieProduitResource extends JsonResource
{
    private function normalizeImageUrl(?string $value): ?string
    {
        $url = trim((string) ($value ?? ''));
        if ($url === '') {
            return null;
        }

        if (str_contains($url, '127.0.0.1') || str_contains($url, 'localhost')) {
            $parsedPath = parse_url($url, PHP_URL_PATH);
            if (is_string($parsedPath) && str_starts_with($parsedPath, '/storage/')) {
                return $parsedPath;
            }
            return null;
        }

        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            $parsedPath = parse_url($url, PHP_URL_PATH);
            if (is_string($parsedPath) && str_starts_with($parsedPath, '/storage/')) {
                return $parsedPath;
            }
            return $url;
        }

        return $url;
    }

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
            'image_url'    => $this->normalizeImageUrl($this->image_url),
            'image'        => $this->normalizeImageUrl($this->image),
            'produits_count' => $this->whenCounted('produits'),
            'parent'       => new self($this->whenLoaded('parent')),
            'children'     => self::collection($this->whenLoaded('children')),
            'children_recursive' => self::collection($this->whenLoaded('childrenRecursive')),
        ];
    }
}
