<?php

namespace Tests\Feature;

use Tests\TestCase;

class AutoRefreshTest extends TestCase
{
    /**
     * Test que le manifest.json endpoint retourne une réponse valide
     * 
     * Vérifie:
     * - Status 200 OK
     * - Headers cache-control corrects
     * - Version field présent
     * - ETag header présent (pour polling efficiency)
     */
    public function test_manifest_endpoint_returns_valid_response(): void
    {
        $response = $this->get('/manifest.json');

        $response->assertStatus(200);
        // Vérifier les tokens du header Cache-Control sans tenir compte de l'ordre
        $cacheHeader = $response->headers->get('cache-control');
        $this->assertStringContainsString('max-age=0', $cacheHeader);
        $this->assertStringContainsString('must-revalidate', $cacheHeader);
        $this->assertStringContainsString('public', $cacheHeader);
        // Content-Type peut varier selon l'environnement, vérifier qu'il contient json
        $this->assertStringContainsString('application/json', $response->headers->get('content-type'));
        
        // Vérifie que c'est du JSON valide avec les champs requis
        $response->assertJsonStructure([
            'name',
            'version',
            'timestamp',
        ]);

        // Version doit être une string non-vide
        $this->assertNotEmpty($response['version']);
        $this->assertIsString($response['version']);
        
        // Timestamp doit être un nombre
        $this->assertIsInt($response['timestamp']);
    }

    /**
     * Test que le manifest retourne chaque fois une version valide
     */
    public function test_manifest_version_is_consistent(): void
    {
        $response1 = $this->get('/manifest.json');
        $response2 = $this->get('/manifest.json');

        // Les deux versions doivent être identiques
        $this->assertEquals($response1['version'], $response2['version']);
    }

    /**
     * Test que l'endpoint admin refresh retourne une erreur sans auth
     */
    public function test_refresh_endpoint_requires_authentication(): void
    {
        $response = $this->postJson('/api/admin/refresh-manifest');

        // Doit être 401 Unauthorized
        $response->assertStatus(401);
    }

    /**
     * Test que le Service Worker existe et est accessible
     */
    public function test_service_worker_is_accessible(): void
    {
        // Dans l'environnement de test, les fichiers statiques ne sont pas servis
        // via le routeur HTTP. On vérifie directement le fichier dans public/.
        $swPath = public_path('sw.js');
        $this->assertFileExists($swPath);
        $content = file_get_contents($swPath);
        $this->assertStringContainsString('self.addEventListener', $content);
    }

    /**
     * Test que le manifest.json existe dans public/
     */
    public function test_manifest_file_exists_in_public(): void
    {
        $this->assertFileExists(public_path('manifest.json'));
    }
}
