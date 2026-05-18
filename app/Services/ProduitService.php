<?php

namespace App\Services;

use App\Models\CategorieProduit;
use App\Models\Produit;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

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
        $query = Produit::with(['pays', 'images', 'commentaires', 'categorie.parent.parent'])
                        ->orderByDesc('date_creation');

        if (!empty($filters['id_pays'])) {
            $query->where('id_pays', $filters['id_pays']);
        }

        if (!empty($filters['statuts']) && is_array($filters['statuts'])) {
            $query->whereIn('statut', $filters['statuts']);
        } elseif (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        } else {
            // Valeur par défaut tolérante: certains jeux de données utilisent "actif" au lieu de "disponible".
            // En environnement local/testing, être plus permissif (ne pas filtrer) pour faciliter le développement.
            $applyDefaultStatut = true;
            try {
                $env = env('APP_ENV', 'production');
                if (in_array($env, ['local', 'testing'], true)) {
                    $applyDefaultStatut = false;
                }
            } catch (\Throwable $e) {
                $applyDefaultStatut = true;
            }

            if ($applyDefaultStatut) {
                $query->whereIn('statut', ['disponible', 'actif']);
            }
        }

        if (!empty($filters['id_categories']) && is_array($filters['id_categories'])) {
            $query->whereIn('id_categorie', $filters['id_categories']);
        } elseif (!empty($filters['id_categorie'])) {
            $query->where('id_categorie', $filters['id_categorie']);
        }

        if (!empty($filters['segment'])) {
            $query->whereHas('categorie', function ($categorieQuery) use ($filters) {
                $categorieQuery->where('segment', $filters['segment']);
            });
        }

        if (!empty($filters['category_slug'])) {
            $category = CategorieProduit::query()
                ->select(['id_categorie', 'parent_id'])
                ->where('slug', $filters['category_slug'])
                ->first();

            if (!$category) {
                $query->whereRaw('1 = 0');
            } else {
                $categoryIds = [$category->id_categorie];

                if (!empty($filters['include_descendants'])) {
                    $categoryIds = $this->collectDescendantCategoryIds($category);
                }

                $query->whereIn('id_categorie', $categoryIds);
            }
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

        if (!empty($filters['modele'])) {
            $query->where('modele', 'LIKE', '%' . $filters['modele'] . '%');
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
                  ->orWhere('reference', 'LIKE', "%{$terme}%")
                  ->orWhere('modele', 'LIKE', "%{$terme}%")
                  ->orWhere('slug', 'LIKE', "%{$terme}%");
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
        return Produit::with(['pays', 'images', 'commentaires', 'categorie.parent.parent'])
            ->where(function ($query) use ($terme) {
                $query->where('titre', 'LIKE', "%{$terme}%")
                      ->orWhere('description', 'LIKE', "%{$terme}%")
                      ->orWhere('marque', 'LIKE', "%{$terme}%");
            })
            ->orderByDesc('date_creation')
            ->get();
    }

    public function getEnVedette($idPays = null)
    {
        return Produit::with(['pays', 'images', 'commentaires', 'categorie.parent.parent'])
            ->where('est_en_vedette', true)
            ->whereIn('statut', ['disponible', 'actif'])
            ->when($idPays, fn ($q) => $q->where('id_pays', $idPays))
            ->orderByDesc('date_creation')
            ->get();
    }

    public function getNouveaux($idPays = null)
    {
        return Produit::with(['pays', 'images', 'commentaires', 'categorie.parent.parent'])
            ->where('est_nouveau', true)
            ->whereIn('statut', ['disponible', 'actif'])
            ->when($idPays, fn ($q) => $q->where('id_pays', $idPays))
            ->orderByDesc('date_creation')
            ->get();
    }

    public function getEnPromotion($idPays = null)
    {
        return Produit::with(['pays', 'images', 'commentaires', 'categorie.parent.parent'])
            ->where('en_promo', true)
            ->whereIn('statut', ['disponible', 'actif'])
            ->when($idPays, fn ($q) => $q->where('id_pays', $idPays))
            ->orderByDesc('date_creation')
            ->get();
    }

    public function getBySlug(string $slug): ?Produit
    {
        return Produit::with(['pays', 'images', 'commentaires', 'categorie.parent.parent.children'])
            ->where('slug', $slug)
            ->first();
    }

    public function getById(int $id): ?Produit
    {
        return Produit::with(['pays', 'images', 'commentaires', 'categorie.parent.parent.children'])->find($id);
    }

    public function create(array $data): Produit
    {
        $payload = $this->preparePayload($data, true);
        $imageUrls = Arr::pull($payload, 'image_urls', []);

        $produit = Produit::create($payload);
        $this->syncImageUrls($produit, $imageUrls);

        return $produit->fresh(['pays', 'images', 'commentaires', 'categorie.parent.parent']);
    }

    public function update(Produit $produit, array $data): Produit
    {
        $payload = $this->preparePayload($data);
        $imageUrls = Arr::pull($payload, 'image_urls', null);

        $produit->update($payload);

        if (is_array($imageUrls)) {
            $this->syncImageUrls($produit, $imageUrls);
        }

        return $produit->fresh(['pays', 'images', 'commentaires', 'categorie.parent.parent']);
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
            return $produit->fresh(['pays', 'images', 'commentaires', 'categorie.parent.parent']);
        }

        return null;
    }

    public function forceDelete(int $id): bool
    {
        $produit = Produit::withTrashed()->find($id);
        return $produit ? (bool) $produit->forceDelete() : false;
    }

    public function uploadImages(Produit $produit, array $images, bool $replace = false): array
    {
        if ($replace) {
            $produit->images()->delete();
            $images = array_slice($images, 0, 1);
        }

        $urls = [];
        foreach ($images as $image) {
            $path = $image->store('produits', 'public');
            // Stocker un chemin web stable, indépendant de APP_URL (évite les URLs localhost en prod).
            $publicUrl = '/storage/' . ltrim($path, '/');
            $produit->images()->create([
                'url' => $publicUrl,
                'path' => $path,
                'alt' => $produit->titre,
            ]);
            $urls[] = $publicUrl;
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

    /**
     * @return array<int>
     */
    private function collectDescendantCategoryIds(CategorieProduit $category): array
    {
        $root = CategorieProduit::query()
            ->with('childrenRecursive')
            ->find($category->id_categorie);

        if (!$root) {
            return [];
        }

        return $this->flattenCategoryIds(collect([$root]))->values()->unique()->all();
    }

    private function flattenCategoryIds(Collection $categories): Collection
    {
        return $categories->flatMap(function (CategorieProduit $category) {
            $children = $category->relationLoaded('childrenRecursive')
                ? $category->childrenRecursive
                : collect();

            return collect([$category->id_categorie])->merge($this->flattenCategoryIds($children));
        });
    }

    private function preparePayload(array $data, bool $isCreating = false): array
    {
        // Conserver le segment (colonne produits.segment) avec normalisation stricte.
        if (array_key_exists('segment', $data)) {
            $segment = strtolower(trim((string) $data['segment']));
            $data['segment'] = in_array($segment, ['general', 'geovision'], true)
                ? $segment
                : null;
        }

        // Si le segment n'est pas explicitement fourni, l'hériter de la catégorie.
        if ((empty($data['segment']) || $data['segment'] === null) && !empty($data['id_categorie'])) {
            $categorySegment = CategorieProduit::query()
                ->where('id_categorie', $data['id_categorie'])
                ->value('segment');

            if (is_string($categorySegment) && $categorySegment !== '') {
                $normalizedCategorySegment = strtolower(trim($categorySegment));
                if (in_array($normalizedCategorySegment, ['general', 'geovision'], true)) {
                    $data['segment'] = $normalizedCategorySegment;
                }
            }
        }

        // Si la colonne 'segment' n'existe pas dans la table (migration non appliquée),
        // retirer la clé pour éviter une QueryException lors de l'update.
        try {
            if (!Schema::hasColumn('produits', 'segment')) {
                unset($data['segment']);
            }
        } catch (\Throwable $e) {
            // Ne pas empêcher l'exécution; en environnement de tests ou connexions particulières
            // Schema::hasColumn pourrait échouer — on ignore proprement.
        }

        if (array_key_exists('specifications', $data) && is_array($data['specifications'])) {
            $data['specifications'] = $this->normalizeSpecifications($data['specifications']);
        }

        if ($isCreating && (!array_key_exists('date_creation', $data) || empty($data['date_creation']))) {
            $data['date_creation'] = now();
        }

        return $data;
    }

    private function normalizeSpecifications(array $specifications): array
    {
        $features = array_values(array_filter(
            Arr::get($specifications, 'features', []),
            fn ($feature) => filled($feature)
        ));

        $tags = array_values(array_filter(
            Arr::get($specifications, 'tags', []),
            fn ($tag) => filled($tag)
        ));

        $platforms = array_values(array_filter(
            Arr::get($specifications, 'platforms', []),
            fn ($platform) => filled($platform)
        ));

        $useCases = array_values(array_filter(
            Arr::get($specifications, 'use_cases', []),
            fn ($item) => filled($item)
        ));

        $detailNotes = array_values(array_filter(
            Arr::get($specifications, 'detail_notes', []),
            fn ($item) => filled($item)
        ));

        $technicalSpecs = array_values(array_filter(
            Arr::get($specifications, 'technical_specs', []),
            fn ($spec) => filled($spec['label'] ?? null) || filled($spec['value'] ?? null)
        ));

        $taxonomy = array_filter([
            'family' => Arr::get($specifications, 'taxonomy.family'),
            'category' => Arr::get($specifications, 'taxonomy.category'),
            'subcategory' => Arr::get($specifications, 'taxonomy.subcategory'),
            'series' => Arr::get($specifications, 'taxonomy.series'),
        ], fn ($value) => filled($value));

        return array_filter([
            'overview' => Arr::get($specifications, 'overview'),
            'tags' => $tags,
            'features' => $features,
            'platforms' => $platforms,
            'use_cases' => $useCases,
            'detail_notes' => $detailNotes,
            'source_url' => Arr::get($specifications, 'source_url'),
            'technical_specs' => $technicalSpecs,
            'taxonomy' => $taxonomy,
        ], function ($value) {
            if (is_array($value)) {
                return !empty($value);
            }

            return filled($value);
        });
    }

    private function syncImageUrls(Produit $produit, array $imageUrls): void
    {
        $normalizedUrls = collect($imageUrls)
            ->filter(fn ($url) => filled($url))
            ->map(fn ($url) => trim((string) $url))
            ->unique()
            ->values();

        $produit->images()->delete();

        $normalizedUrls->each(function (string $url) use ($produit) {
            $normalizedUrl = $url;
            if (!str_starts_with($normalizedUrl, 'http://') && !str_starts_with($normalizedUrl, 'https://') && !str_starts_with($normalizedUrl, '/')) {
                $normalizedUrl = '/storage/' . ltrim($normalizedUrl, '/');
            }

            $path = $normalizedUrl;
            if (str_starts_with($normalizedUrl, '/storage/')) {
                $path = ltrim(substr($normalizedUrl, strlen('/storage/')), '/');
            }

            $produit->images()->create([
                'url' => $normalizedUrl,
                'path' => $path,
                'alt' => $produit->titre,
            ]);
        });
    }
}
