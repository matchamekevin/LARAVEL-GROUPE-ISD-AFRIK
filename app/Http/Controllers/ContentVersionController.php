<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ContentVersionController extends Controller
{
    /**
     * Version courte des donnees metier pour rafraichissement client.
     * Cette route est publique et legere: resultat mis en cache 1 seconde.
     */
    public function show(): JsonResponse
    {
        try {
            $payload = Cache::remember('content.version.payload', 1, function () {
                return $this->generateVersionPayload();
            });

            return response()
                ->json($payload)
                ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
                ->header('Pragma', 'no-cache');
        } catch (Throwable $e) {
            // Log the error but return a safe default response
            \Log::error('ContentVersionController: Failed to generate version payload', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return a safe default when cache fails
            return response()
                ->json([
                    'version' => 'error-'.time(),
                    'updated_at' => time(),
                ])
                ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
                ->header('Pragma', 'no-cache');
        }
    }

    /**
     * Generate the version payload from database table timestamps.
     */
    private function generateVersionPayload(): array
    {
        $tables = [
            'categories_produits',
            'produits',
            'formations',
            'home_marketing_cards',
            'home_testimonials',
            'home_collaborators',
            'home_partners',
        ];

        $parts = [];
        $latest = 0;

        foreach ($tables as $table) {
            try {
                if (! Schema::hasTable($table)) {
                    continue;
                }

                $timestampColumn = Schema::hasColumn($table, 'updated_at')
                    ? 'updated_at'
                    : (Schema::hasColumn($table, 'created_at') ? 'created_at' : null);

                if (! $timestampColumn) {
                    continue;
                }

                $maxValue = DB::table($table)->max($timestampColumn);
                $unix = $maxValue ? strtotime((string) $maxValue) : 0;
                $latest = max($latest, (int) $unix);
                $parts[] = sprintf('%s:%d', $table, (int) $unix);
            } catch (Throwable $e) {
                // Skip this table if there's an error querying it
                \Log::debug("ContentVersionController: Skipping table $table", [
                    'error' => $e->getMessage(),
                ]);

                continue;
            }
        }

        if (empty($parts)) {
            $parts[] = 'empty:0';
        }

        return [
            'version' => sha1(implode('|', $parts)),
            'updated_at' => $latest,
        ];
    }
}
