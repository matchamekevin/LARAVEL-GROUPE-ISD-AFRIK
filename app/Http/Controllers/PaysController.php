<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaysRequest;
use App\Http\Resources\PaysResource;
use App\Services\PaysService;
use Illuminate\Http\JsonResponse;

/**
 * PaysController
 *
 * Contrôleur REST du module Pays.
 * Gère les opérations CRUD avec validation, pagination et filtres.
 */
class PaysController extends Controller
{
    protected PaysService $service;

    public function __construct(PaysService $service)
    {
        $this->service = $service;
    }

    /**
     * Liste tous les pays avec filtres et pagination.
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index()
    {
        $filters = request()->only(['nom', 'code', 'langue', 'per_page']);
        $pays = $this->service->getCatalogue($filters);

        return PaysResource::collection($pays);
    }

    /**
     * Affiche un pays spécifique avec ses produits et formations.
     *
     * @param int $id
     * @return JsonResponse|PaysResource
     */
    public function show(int $id)
    {
        $pays = $this->service->getPays($id);

        if (!$pays) {
            return response()->json(['message' => 'Pays introuvable'], 404);
        }

        return new PaysResource($pays);
    }

    /**
     * Crée un nouveau pays.
     *
     * @param PaysRequest $request
     * @return JsonResponse
     */
    public function store(PaysRequest $request)
    {
        try {
            $pays = $this->service->create($request->validated());

            return (new PaysResource($pays))
                ->response()
                ->setStatusCode(201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création du pays',
                'details' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Met à jour un pays existant.
     *
     * @param PaysRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(PaysRequest $request, int $id): JsonResponse
    {
        try {
            $pays = $this->service->update($id, $request->validated());

            if (!$pays) {
                return response()->json(['message' => 'Pays introuvable'], 404);
            }

            return (new PaysResource($pays))->response();
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du pays',
                'details' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Supprime un pays.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        if (!$this->service->delete($id)) {
            return response()->json(['message' => 'Pays introuvable'], 404);
        }

        return response()->json(['message' => 'Pays supprimé avec succès'], 200);
    }
}