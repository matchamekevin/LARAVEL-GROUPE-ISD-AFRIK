<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ImageResource
 * Formate l'objet Image pour les réponses JSON de l'API.
 */
class ImageResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id_image,               // Clé primaire
            'url' => $this->url,                   // URL publique
            'path' => $this->path,                 // Chemin interne (stockage)
            'alt' => $this->alt,                   // Texte alternatif (accessibilité/SEO)
            'attached_to' => $this->imageable_type, // Type d'entité liée (PRODUIT, FORMATION, BLOG)
            'attached_id' => $this->imageable_id,   // ID de l'entité liée
            'created_at' => $this->created_at,     // Date de création
            'updated_at' => $this->updated_at,     // Date de mise à jour
        ];
    }
}