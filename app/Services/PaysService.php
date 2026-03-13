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
     * @param array $filters
     * @return LengthAwarePaginator|Collection
     */
    public function getCatalogue(array $filters = [])
    {
        $query = Pays::query();

        // 🔍 Filtres
        if (!empty($filters['nom'])) {
            $query->where('nom_pays', 'LIKE', '%'.$filters['nom'].'%');
        }

        if (!empty($filters['code'])) {
            $query->where('code_pays', $filters['code']);
        }

        if (!empty($filters['langue'])) {
            $query->where('langue_principale', $filters['langue']);
        }

        // ⚡ Pagination par défaut
        return $query->orderBy('nom_pays')->paginate($filters['per_page'] ?? 10);
    }

    /**
     * Récupère un pays par son ID avec ses relations.
     *
     * @param int $id
     * @return Pays|null
     */
    public function getPays(int $id): ?Pays
    {
        return Pays::with(['produits', 'formations'])->find($id);
    }

    /**
     * Crée un nouveau pays.
     *
     * @param array $data
     * @return Pays
     * @throws \Exception
     */
    public function create(array $data): Pays
    {
        // Vérifie si le code_pays existe déjà
        if (Pays::where('code_pays', $data['code_pays'])->exists()) {
            throw new \Exception("Ce code pays existe déjà.");
        }

        return Pays::create($data);
    }

    /**
     * Met à jour un pays existant.
     *
     * @param int $id
     * @param array $data
     * @return Pays|null
     */
    public function update(int $id, array $data): ?Pays
    {
        $pays = Pays::find($id);
        if ($pays) {
            // Vérifie si le nouveau code_pays est déjà utilisé par un autre pays
            if (isset($data['code_pays'])) {
                $exists = Pays::where('code_pays', $data['code_pays'])
                              ->where('id_pays', '!=', $id)
                              ->exists();
                if ($exists) {
                    throw new \Exception("Ce code pays est déjà attribué à un autre pays.");
                }
            }

            $pays->update($data);
        }
        return $pays;
    }

    /**
     * Supprime un pays.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $pays = Pays::find($id);
        if ($pays) {
            $pays->delete();
            return true;
        }
        return false;
    }
}