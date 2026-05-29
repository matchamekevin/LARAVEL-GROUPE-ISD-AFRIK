<?php

namespace App\Services;

use App\Models\Pays;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PaysService
{
    /**
     * Récupère la liste des pays avec filtres et pagination.
     *
     * @return LengthAwarePaginator|Collection
     */
    public function getCatalogue(array $filters = [])
    {
        $query = Pays::query();

        // 🔍 Filtres
        if (! empty($filters['nom'])) {
            $query->where('nom_pays', 'LIKE', '%'.$filters['nom'].'%');
        }

        if (! empty($filters['code'])) {
            $query->where('code_pays', $filters['code']);
        }

        if (! empty($filters['langue'])) {
            $query->where('langue_principale', $filters['langue']);
        }

        // ⚡ Pagination par défaut
        return $query->orderBy('nom_pays')->paginate($filters['per_page'] ?? 10);
    }

    /**
     * Récupère un pays par son ID, avec relations optionnelles.
     *
     * @param  array  $with  Relations à charger (ex: ['produits', 'formations'])
     */
    public function getPays(string $id, array $with = []): ?Pays
    {
        $query = Pays::query();
        if (! empty($with)) {
            $query->with($with);
        }

        return $query->find($id);
    }

    /**
     * Crée un nouveau pays.
     *
     * @throws \Exception
     */
    public function create(array $data): Pays
    {
        // Vérifie si le code_pays existe déjà
        if (Pays::where('code_pays', $data['code_pays'])->exists()) {
            throw new \Exception('Ce code pays existe déjà.');
        }

        return Pays::create($data);
    }

    /**
     * Met à jour un pays existant.
     */
    public function update(string $id, array $data): ?Pays
    {
        $pays = Pays::find($id);
        if ($pays) {
            // Vérifie si le nouveau code_pays est déjà utilisé par un autre pays
            if (isset($data['code_pays'])) {
                $exists = Pays::where('code_pays', $data['code_pays'])
                    ->where('id_pays', '!=', $id)
                    ->exists();
                if ($exists) {
                    throw new \Exception('Ce code pays est déjà attribué à un autre pays.');
                }
            }

            $pays->update($data);
        }

        return $pays;
    }

    /**
     * Supprime un pays.
     */
    public function delete(string $id): bool
    {
        $pays = Pays::find($id);
        if ($pays) {
            $pays->delete();

            return true;
        }

        return false;
    }
}
