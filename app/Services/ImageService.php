<?php

namespace App\Services;

use App\Models\Image;

class ImageService
{
    public function all()
    {
        return Image::orderByDesc('created_at')->get();
    }

    public function create(array $data): Image
    {
        $data['imageable_type'] = $this->mapType($data['imageable_type']);
        return Image::create($data);
    }

    public function find(int $id): ?Image
    {
        return Image::find($id);
    }

    public function update(int $id, array $data): ?Image
    {
        $image = Image::find($id);
        if (!$image) {
            return null;
        }

        if (!empty($data['imageable_type'])) {
            $data['imageable_type'] = $this->mapType($data['imageable_type']);
        }

        $image->update($data);
        return $image->fresh();
    }

    public function delete(int $id): bool
    {
        $image = Image::find($id);
        if (!$image) {
            return false;
        }

        return (bool) $image->delete(); // soft delete
    }

    /**
     * Restaure une image supprimée logiquement (SoftDeletes).
     */
    public function restore(int $id): ?Image
    {
        $image = Image::withTrashed()->find($id);

        if ($image && $image->deleted_at !== null) {
            $image->restore();
            return $image->fresh();
        }

        return null;
    }

    /**
     * Supprime définitivement une image (force delete).
     */
    public function forceDelete(int $id): bool
    {
        $image = Image::withTrashed()->find($id);

        if ($image) {
            return (bool) $image->forceDelete();
        }

        return false;
    }

    /**
     * Convertit un type simplifié (PRODUIT, FORMATION, BLOG)
     * en namespace complet attendu par Laravel.
     */
    private function mapType(string $type): string
    {
        switch (strtoupper($type)) {
            case 'PRODUIT':
                return \App\Models\Produit::class;
            case 'FORMATION':
                return \App\Models\Formation::class;
            case 'BLOG':
                return \App\Models\Blog::class;
            default:
                return $type; // fallback si déjà namespace complet
        }
    }
}