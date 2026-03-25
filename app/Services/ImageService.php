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
     * Normalise le type vers les alias stockés en base
     * (PRODUIT, FORMATION, BLOG, CATEGORY).
     */
    private function mapType(string $type): string
    {
        $normalized = strtoupper(trim($type));

        switch ($normalized) {
            case 'PRODUIT':
            case 'APP\\MODELS\\PRODUIT':
                return 'PRODUIT';
            case 'FORMATION':
            case 'APP\\MODELS\\FORMATION':
                return 'FORMATION';
            case 'BLOG':
            case 'APP\\MODELS\\BLOG':
                return 'BLOG';
            case 'CATEGORY':
            case 'APP\\MODELS\\CATEGORIEPRODUIT':
                return 'CATEGORY';
            default:
                return $normalized;
        }
    }
}