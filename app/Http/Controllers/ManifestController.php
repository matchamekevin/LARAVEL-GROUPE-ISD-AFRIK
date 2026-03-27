<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;

/**
 * Controller pour servir le manifest.json avec versioning
 * Utilisé par le système d'auto-refresh côté client
 */
class ManifestController extends Controller
{
    /**
     * Servir le manifest.json avec version dynamique
     * GET /manifest.json
     */
    public function show(): Response|JsonResponse
    {
        // Version basée sur le chash du build dist ou current time
        $version = $this->getApplicationVersion();
        $timestamp = now()->timestamp * 1000;

        // Lire le manifest template
        $manifestPath = public_path('manifest.json');
        
        if (!file_exists($manifestPath)) {
            return response()->json([
                'name' => config('app.name'),
                'version' => $version,
                'timestamp' => $timestamp,
            ]);
        }

        $manifest = json_decode(file_get_contents($manifestPath), true);
        
        // Remplacer les placeholders
        $manifest['version'] = $version;
        $manifest['timestamp'] = $timestamp;

        return response()
            ->json($manifest)
            ->header('Cache-Control', 'public, max-age=0, must-revalidate')
            ->header('ETag', '"' . $version . '"')
            ->header('X-App-Version', $version);
    }

    /**
     * Obtenir la version de l'application (basée sur build files)
     */
    private function getApplicationVersion(): string
    {
        // En production: utiliser le hash du manifest.json du build Vite
        $buildManifestPath = public_path('build/.vite/manifest.json');
        
        if (file_exists($buildManifestPath)) {
            $hash = md5_file($buildManifestPath);
            return 'v' . substr($hash, 0, 8);
        }

        // Fallback: utiliser le timestamp de dernière modification des assets
        $publicPath = public_path();
        $latestModTime = 0;

        foreach (['css', 'js', 'build'] as $dir) {
            $dirPath = $publicPath . '/' . $dir;
            if (is_dir($dirPath)) {
                $modTime = filemtime($dirPath);
                $latestModTime = max($latestModTime, $modTime);
            }
        }

        // Créer une version simple basée sur le timestamp
        return 'v' . date('YmdH', $latestModTime);
    }

    /**
     * Endpoint pour forcer le refresh du manifest
     * POST /api/refresh-manifest (admin only)
     */
    public function refresh()
    {
        // Cette route peut être appelée lors d'un déploiement
        // pour invalider le cache côté client

        cache()->forget('app.version');
        
        return response()->json([
            'message' => 'Manifest refreshed',
            'version' => $this->getApplicationVersion(),
        ]);
    }
}
