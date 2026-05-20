<?php

return [
    // Autoriser aussi l'endpoint de logs du navigateur utilisé par le "browser logger" (_boost)
    // Allow API routes, all sanctum endpoints, and the browser logger path
    'paths' => ['api/*', 'sanctum/*', '_boost/*'],
    
    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    | Configure en production la variable d'environnement `CORS_ALLOWED_ORIGINS`
    | comme une liste séparée par des virgules des domaines autorisés, ex:
    | "https://example.com,https://www.example.com"
    | Si vide ou égal à "*" alors on autorise toutes les origines (pas recommandé).
    */
    'allowed_origins' => (function () {
        $raw = env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:8000,http://127.0.0.1:8000');
        if ($raw === '*' || $raw === '') {
            return ['*'];
        }
        return array_map('trim', explode(',', $raw));
    })(),

    'allowed_origins_patterns' => [],
    
    'allowed_headers' => ['*'],
    
    'exposed_headers' => [],
    
    'max_age' => 0,
    
    // We need credentials for session/csrf cookies (login, sanctum). Keep enabled.
    'supports_credentials' => true,
];



