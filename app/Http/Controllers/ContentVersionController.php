<?php

namespace App\Http\Controllers;

use App\Support\CacheVersion;
use Illuminate\Http\JsonResponse;

class ContentVersionController extends Controller
{
    public function show(): JsonResponse
    {
        return response()
            ->json([
                'version' => CacheVersion::hash(),
                'versions' => CacheVersion::allVersions(),
                'updated_at' => time(),
            ])
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
            ->header('Pragma', 'no-cache');
    }
}
