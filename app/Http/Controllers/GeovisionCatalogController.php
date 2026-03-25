<?php

namespace App\Http\Controllers;

use App\Services\GeovisionCatalogSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeovisionCatalogController extends Controller
{
    public function __construct(
        private readonly GeovisionCatalogSyncService $syncService
    ) {
    }

    public function sync(Request $request): JsonResponse
    {
        @set_time_limit(0);

        try {
            $result = $this->syncService->sync(
                replace: $request->boolean('replace', true),
                fetchDetails: $request->boolean('fetch_details', true),
            );

            return response()->json([
                'message' => 'Catalogue GeoVision officiel synchronisé.',
                'data' => $result,
            ]);
        } catch (\Throwable $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }
    }
}
