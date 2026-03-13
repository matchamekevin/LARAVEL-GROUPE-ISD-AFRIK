<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    
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
        $raw = env('CORS_ALLOWED_ORIGINS', '*');
        if ($raw === '*' || $raw === '') {
            return ['*'];
        }
        return array_map('trim', explode(',', $raw));
    })(),

    'allowed_origins_patterns' => [],
    
    'allowed_headers' => ['*'],
    
    'exposed_headers' => [],
    
    'max_age' => 0,
    
    'supports_credentials' => true,
];



