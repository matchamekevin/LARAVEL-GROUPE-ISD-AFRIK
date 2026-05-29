<?php

namespace App\Http\Controllers;

use App\Http\Requests\CommentaireRequest;
use App\Http\Resources\CommentaireResource;
use App\Services\CommentaireService;
use App\Services\FormMailDispatcher;
use App\Services\FormMailRouteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * CommentaireController
 * Gère les endpoints API pour les commentaires.
 */
class CommentaireController extends Controller
{
    public function __construct(
        private CommentaireService $commentaireService,
        private readonly FormMailDispatcher $formMailDispatcher
    ) {}

    /** GET /api/commentaires : liste des commentaires paginée */
    public function index(Request $request)
    {
        $perPage = max(1, min(50, (int) $request->query('per_page', 20)));
        $commentaires = $this->commentaireService->all($perPage);

        return CommentaireResource::collection($commentaires);
    }

    /** POST /api/commentaires : créer un commentaire */
    public function store(CommentaireRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $user = $request->user();

        if ($user) {
            $payload['id_utilisateur'] = $payload['id_utilisateur'] ?? ($user->id_utilisateur ?? $user->id ?? null);
        }

        $commentaire = $this->commentaireService->create($payload);

        if (strtoupper((string) ($payload['commentable_type'] ?? '')) === 'PRODUIT') {
            try {
                $this->formMailDispatcher->sendText(
                    formKey: FormMailRouteService::FORM_PRODUCT_REVIEW,
                    subject: 'Nouvel avis produit',
                    lines: [
                        'Un nouvel avis produit a ete publie.',
                        '',
                        'Produit ID: '.(string) ($payload['commentable_id'] ?? '-'),
                        'Utilisateur ID: '.(string) ($payload['id_utilisateur'] ?? '-'),
                        'Note: '.(string) ($payload['note'] ?? 'Non notee'),
                        'Contenu:',
                        (string) ($payload['contenu'] ?? '-'),
                        '',
                        'Date: '.now()->format('d/m/Y H:i:s'),
                    ],
                    replyToEmail: $user?->email ?? null,
                    replyToName: trim((string) (($user?->prenom ?? '').' '.($user?->nom ?? '')))
                );
            } catch (\Throwable $exception) {
                Log::error('Echec envoi email avis produit', [
                    'exception' => $exception->getMessage(),
                    'commentable_id' => $payload['commentable_id'] ?? null,
                ]);
            }
        }

        return response()->json(new CommentaireResource($commentaire), 201);
    }

    /** GET /api/commentaires/{id} : afficher un commentaire */
    public function show(string $id): JsonResponse
    {
        $commentaire = $this->commentaireService->find($id);

        if (! $commentaire) {
            return response()->json(['message' => 'Commentaire introuvable'], 404);
        }

        return response()->json(new CommentaireResource($commentaire), 200);
    }

    /** PUT /api/commentaires/{id} : mettre à jour un commentaire */
    public function update(CommentaireRequest $request, string $id): JsonResponse
    {
        $commentaire = $this->commentaireService->update($id, $request->validated());

        if (! $commentaire) {
            return response()->json(['message' => 'Commentaire introuvable'], 404);
        }

        return response()->json(new CommentaireResource($commentaire), 200);
    }

    /** DELETE /api/commentaires/{id} : supprimer un commentaire */
    public function destroy(string $id): JsonResponse
    {
        $deleted = $this->commentaireService->delete($id);

        if (! $deleted) {
            return response()->json(['message' => 'Commentaire introuvable'], 404);
        }

        return response()->json(['message' => 'Commentaire supprimé avec succès'], 200);
    }
}
