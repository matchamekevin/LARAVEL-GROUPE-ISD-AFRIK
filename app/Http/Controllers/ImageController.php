<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImageRequest;
use App\Http\Resources\ImageResource;
use App\Models\Image;
use App\Services\Base64ImageService;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
     * POST /api/admin/images/upload : uploader un fichier image et retourner son URL publique
     */
    public function upload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $encoded = Base64ImageService::encode($request->file('image'));

        $image = Image::create([
            'image_data' => $encoded['data'],
            'image_mime' => $encoded['mime'],
            'url' => null,
            'path' => null,
            'alt' => $request->input('alt', ''),
        ]);

        return response()->json([
            'id' => $image->id_image,
            'url' => $image->image_url,
            'path' => null,
        ], 201);
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
    public function show(string $id): JsonResponse
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
    public function update(ImageRequest $request, string $id): JsonResponse
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
    public function destroy(string $id): JsonResponse
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
    public function restore(string $id): JsonResponse
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
    public function forceDelete(string $id): JsonResponse
    {
        $deleted = $this->imageService->forceDelete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Image introuvable'], 404);
        }

        return response()->json(['message' => 'Image supprimée définitivement'], 200);
    }

    /**
     * GET /api/images/{id}/serve : servir une image (base64 ou fichier)
     */
    public function serve(string $id)
    {
        $image = Image::find($id);

        if (!$image) {
            abort(404);
        }

        if ($image->image_data) {
            return Base64ImageService::response($image->image_data, $image->image_mime);
        }

        if ($image->path && Storage::disk('public')->exists($image->path)) {
            return response()->file(Storage::disk('public')->path($image->path));
        }

        abort(404);
    }
}