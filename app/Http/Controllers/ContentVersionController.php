<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ContentVersionController extends Controller
{
    /**
     * Version courte des donnees metier pour rafraichissement client.
     * Cette route est publique et legere: resultat mis en cache 1 seconde.
     */
    public function show(): JsonResponse
    {
        $payload = Cache::remember('content.version.payload', 1, function () {
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
                if (!Schema::hasTable($table)) {
                    continue;
                }

                $timestampColumn = Schema::hasColumn($table, 'updated_at')
                    ? 'updated_at'
                    : (Schema::hasColumn($table, 'created_at') ? 'created_at' : null);

                if (!$timestampColumn) {
                    continue;
                }

                $maxValue = DB::table($table)->max($timestampColumn);
                $unix = $maxValue ? strtotime((string) $maxValue) : 0;
                $latest = max($latest, (int) $unix);
                $parts[] = sprintf('%s:%d', $table, (int) $unix);
            }

            if (empty($parts)) {
                $parts[] = 'empty:0';
            }

            return [
                'version' => sha1(implode('|', $parts)),
                'updated_at' => $latest,
            ];
        });

        return response()
            ->json($payload)
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
            ->header('Pragma', 'no-cache');
    }
}

