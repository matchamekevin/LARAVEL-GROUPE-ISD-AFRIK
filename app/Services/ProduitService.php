<?php

namespace App\Services;

use App\Models\Produit;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Service métier pour la gestion des produits.
 * Contient la logique métier réutilisable.
 */
class ProduitService
{
    /**
     * Catalogue avec filtres + pagination.
     */
    public function getCatalogue(array $filters = []): LengthAwarePaginator
    {
        $query = Produit::with(['pays', 'images', 'commentaires', 'categorie'])
                        ->orderByDesc('date_creation');

        if (!empty($filters['id_pays'])) {
            $query->where('id_pays', $filters['id_pays']);
        }

        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }

        if (!empty($filters['id_categorie'])) {
            $query->where('id_categorie', $filters['id_categorie']);
        }

        if (!empty($filters['exclude_categorie_ids']) && is_array($filters['exclude_categorie_ids'])) {
            $query->whereNotIn('id_categorie', $filters['exclude_categorie_ids']);
        }

        if (!empty($filters['prix_min'])) {
            $query->where('prix', '>=', $filters['prix_min']);
        }

        if (!empty($filters['prix_max'])) {
            $query->where('prix', '<=', $filters['prix_max']);
        }

        if (!empty($filters['marque'])) {
            $query->where('marque', $filters['marque']);
        }

        if (!empty($filters['en_vedette'])) {
            $query->where('est_en_vedette', true);
        }

        if (!empty($filters['en_promo'])) {
            $query->where('en_promo', true);
        }

        if (!empty($filters['est_nouveau'])) {
            $query->where('est_nouveau', true);
        }

        if (!empty($filters['recherche'])) {
            $terme = $filters['recherche'];
            $query->where(function ($q) use ($terme) {
                $q->where('titre', 'LIKE', "%{$terme}%")
                  ->orWhere('description', 'LIKE', "%{$terme}%")
                  ->orWhere('marque', 'LIKE', "%{$terme}%")
                  ->orWhere('reference', 'LIKE', "%{$terme}%");
            });
        }

        if (!empty($filters['tri'])) {
            switch ($filters['tri']) {
                case 'prix_asc':
                    $query->orderBy('prix', 'asc');
                    break;
                case 'prix_desc':
                    $query->orderBy('prix', 'desc');
                    break;
                case 'populaire':
                    $query->orderBy('vues', 'desc');
                    break;
                case 'note':
                    $query->orderBy('note_moyenne', 'desc');
                    break;
                default:
                    $query->orderByDesc('date_creation');
            }
        }

        return $query->paginate($filters['par_page'] ?? 12);
    }

    /**
     * Recherche textuelle (titre, description, marque).
     */
    public function rechercher(string $terme)
    {
        return Produit::with(['pays', 'images', 'commentaires', 'categorie'])
            ->where(function ($query) use ($terme) {
                $query->where('titre', 'LIKE', "%{$terme}%")
                      ->orWhere('description', 'LIKE', "%{$terme}%")
                      ->orWhere('marque', 'LIKE', "%{$terme}%");
            })
            ->orderByDesc('date_creation')
            ->get();
    }

    public function getEnVedette()
    {
        return Produit::with(['pays', 'images', 'commentaires', 'categorie'])
            ->where('est_en_vedette', true)
            ->where('statut', 'disponible')
            ->orderByDesc('date_creation')
            ->get();
    }

    public function getNouveaux()
    {
        return Produit::with(['pays', 'images', 'commentaires', 'categorie'])
            ->where('est_nouveau', true)
            ->where('statut', 'disponible')
            ->orderByDesc('date_creation')
            ->get();
    }

    public function getEnPromotion()
    {
        return Produit::with(['pays', 'images', 'commentaires', 'categorie'])
            ->where('en_promo', true)
            ->where('statut', 'disponible')
            ->orderByDesc('date_creation')
            ->get();
    }

    public function getBySlug(string $slug): ?Produit
    {
        return Produit::with(['pays', 'images', 'commentaires', 'categorie'])
            ->where('slug', $slug)
            ->first();
    }

    public function getById(int $id): ?Produit
    {
        return Produit::with(['pays', 'images', 'commentaires', 'categorie'])->find($id);
    }

    public function create(array $data): Produit
    {
        $produit = Produit::create($data);
        return $produit->fresh(['pays', 'images', 'commentaires', 'categorie']);
    }

    public function update(Produit $produit, array $data): Produit
    {
        $produit->update($data);
        return $produit->fresh(['pays', 'images', 'commentaires', 'categorie']);
    }

    public function delete(Produit $produit, bool $force = false): ?bool
    {
        return $force ? $produit->forceDelete() : $produit->delete();
    }

    public function restore(int $id): ?Produit
    {
        $produit = Produit::withTrashed()->find($id);

        if ($produit && $produit->deleted_at !== null) {
            $produit->restore();
            return $produit->fresh(['pays', 'images', 'commentaires', 'categorie']);
        }

        return null;
    }

    public function forceDelete(int $id): bool
    {
        $produit = Produit::withTrashed()->find($id);
        return $produit ? (bool) $produit->forceDelete() : false;
    }

    public function uploadImages(Produit $produit, array $images): array
    {
        $urls = [];
        foreach ($images as $image) {
            $path = $image->store('produits', 'public');
            $produit->images()->create(['url' => $path]);
            $urls[] = asset('storage/' . $path);
        }
        return $urls;
    }

    public function deleteImage(Produit $produit, int $imageId): bool
    {
        $image = $produit->images()->find($imageId);
        if (!$image) return false;
        $image->delete();
        return true;
    }
}