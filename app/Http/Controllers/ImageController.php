<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImageRequest;
use App\Http\Resources\ImageResource;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;

/**
 * ImageController
 * Expose les endpoints API pour gérer les images.
 */
class ImageController extends Controller
{
    public function __construct(private ImageService $imageService)
    {
        // Injection de dépendance du service
    }

    /**
     * GET /api/images : lister toutes les images
     */
    public function index()
    {
        $images = $this->imageService->all();
        return ImageResource::collection($images);
    }

    /**
     * POST /api/images : créer une image
     */
    public function store(ImageRequest $request): JsonResponse
    {
        $image = $this->imageService->create($request->validated());
        return response()->json(new ImageResource($image), 201);
    }

    /**
     * GET /api/images/{id} : récupérer une image
     */
    public function show(int $id): JsonResponse
    {
        $image = $this->imageService->find($id);

        if (!$image) {
            return response()->json(['message' => 'Image introuvable'], 404);
        }

        return response()->json(new ImageResource($image), 200);
    }

    /**
     * PUT /api/images/{id} : mettre à jour une image
     */
    public function update(ImageRequest $request, int $id): JsonResponse
    {
        $image = $this->imageService->update($id, $request->validated());

        if (!$image) {
            return response()->json(['message' => 'Image introuvable'], 404);
        }

        return response()->json(new ImageResource($image), 200);
    }

    /**
     * DELETE /api/images/{id} : supprimer une image (soft delete)
     */
    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->imageService->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Image introuvable'], 404);
        }

        return response()->json(['message' => 'Image supprimée avec succès'], 200);
    }

    /**
     * PATCH /api/images/{id}/restore : restaurer une image supprimée
     */
    public function restore(int $id): JsonResponse
    {
        $image = $this->imageService->restore($id);

        if (!$image) {
            return response()->json(['message' => 'Image introuvable ou non supprimée'], 404);
        }

        return response()->json(new ImageResource($image), 200);
    }

    /**
     * DELETE /api/images/{id}/force : suppression définitive
     */
    public function forceDelete(int $id): JsonResponse
    {
        $deleted = $this->imageService->forceDelete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Image introuvable'], 404);
        }

        return response()->json(['message' => 'Image supprimée définitivement'], 200);
    }
}