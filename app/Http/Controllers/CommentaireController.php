<?php

namespace App\Http\Controllers;

use App\Http\Requests\CommentaireRequest;
use App\Http\Resources\CommentaireResource;
use App\Services\CommentaireService;
use Illuminate\Http\JsonResponse;

/**
 * CommentaireController
 * Gère les endpoints API pour les commentaires.
 */
class CommentaireController extends Controller
{
    public function __construct(private CommentaireService $commentaireService)
    {
        // Injection du service
    }

    /** GET /api/commentaires : liste des commentaires */
    public function index()
    {
        $commentaires = $this->commentaireService->all();
        return CommentaireResource::collection($commentaires);
    }

    /** POST /api/commentaires : créer un commentaire */
    public function store(CommentaireRequest $request): JsonResponse
    {
        $commentaire = $this->commentaireService->create($request->validated());
        return response()->json(new CommentaireResource($commentaire), 201);
    }

    /** GET /api/commentaires/{id} : afficher un commentaire */
    public function show(int $id): JsonResponse
    {
        $commentaire = $this->commentaireService->find($id);

        if (!$commentaire) {
            return response()->json(['message' => 'Commentaire introuvable'], 404);
        }

        return response()->json(new CommentaireResource($commentaire), 200);
    }

    /** PUT /api/commentaires/{id} : mettre à jour un commentaire */
    public function update(CommentaireRequest $request, int $id): JsonResponse
    {
        $commentaire = $this->commentaireService->update($id, $request->validated());

        if (!$commentaire) {
            return response()->json(['message' => 'Commentaire introuvable'], 404);
        }

        return response()->json(new CommentaireResource($commentaire), 200);
    }

    /** DELETE /api/commentaires/{id} : supprimer un commentaire */
    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->commentaireService->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Commentaire introuvable'], 404);
        }

        return response()->json(['message' => 'Commentaire supprimé avec succès'], 200);
    }
}