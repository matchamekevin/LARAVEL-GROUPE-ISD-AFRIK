<?php

namespace App\Http\Controllers;

use App\Services\FormMailRouteService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FormMailRouteController extends Controller
{
    public function __construct(private readonly FormMailRouteService $formMailRouteService)
    {
    }

    /**
     * GET /api/admin/form-mail-routes
     */
    public function index()
    {
        return response()->json([
            'data' => $this->formMailRouteService->list(),
        ]);
    }

    /**
     * PUT /api/admin/form-mail-routes/{formKey}
     */
    public function update(Request $request, string $formKey)
    {
        $formKey = strtolower(trim($formKey));

        $payload = $request->validate([
            'form_label' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'is_active' => 'sometimes|boolean',
            'recipients' => 'required|array|min:1',
            'recipients.*' => 'required|string|email|max:255',
        ]);

        $route = $this->formMailRouteService->upsert(
            formKey: $formKey,
            formLabel: $payload['form_label'],
            description: $payload['description'] ?? null,
            recipientsInput: $payload['recipients'],
            isActive: (bool) ($payload['is_active'] ?? true)
        );

        return response()->json([
            'message' => 'Configuration email mise a jour.',
            'data' => $route,
        ]);
    }

    /**
     * POST /api/admin/form-mail-routes
     */
    public function store(Request $request)
    {
        $payload = $request->validate([
            'form_key' => [
                'required',
                'string',
                'max:120',
                'regex:/^[a-z0-9_\-]+$/',
                Rule::unique('form_mail_routes', 'form_key'),
            ],
            'form_label' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'is_active' => 'sometimes|boolean',
            'recipients' => 'required|array|min:1',
            'recipients.*' => 'required|string|email|max:255',
        ]);

        $payload['form_key'] = strtolower(trim((string) $payload['form_key']));

        $route = $this->formMailRouteService->upsert(
            formKey: $payload['form_key'],
            formLabel: $payload['form_label'],
            description: $payload['description'] ?? null,
            recipientsInput: $payload['recipients'],
            isActive: (bool) ($payload['is_active'] ?? true)
        );

        return response()->json([
            'message' => 'Nouveau formulaire ajoute.',
            'data' => $route,
        ], 201);
    }
}
