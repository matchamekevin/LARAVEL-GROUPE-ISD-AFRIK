<?php

use App\Models\Utilisateur;

return [

    /*
    |--------------------------------------------------------------------------
    | Broadcasting
    |--------------------------------------------------------------------------
    */
    'broadcasting' => [
        'echo' => [
            'broadcaster' => 'reverb',
            'key' => env('REVERB_APP_KEY'),
            'wsHost' => env('REVERB_HOST', 'localhost'),
            'wsPort' => env('REVERB_PORT', 8080),
            'wssPort' => env('REVERB_PORT', 8080),
            'forceTLS' => env('REVERB_SCHEME', 'http') === 'https',
            'encrypted' => env('REVERB_SCHEME', 'http') === 'https',
            'enabledTransports' => ['ws', 'wss'],
            'disableStats' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    */
    'default_filesystem_disk' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Assets Path
    |--------------------------------------------------------------------------
    */
    'assets_path' => null,

    /*
    |--------------------------------------------------------------------------
    | Cache Path
    |--------------------------------------------------------------------------
    */
    'cache_path' => base_path('bootstrap/cache/filament'),

    /*
    |--------------------------------------------------------------------------
    | Livewire Loading Delay
    |--------------------------------------------------------------------------
    */
    'livewire_loading_delay' => 'default',

    /*
    |--------------------------------------------------------------------------
    | File Generation
    |--------------------------------------------------------------------------
    */
    'file_generation' => [
        'flags' => [],
    ],

    /*
    |--------------------------------------------------------------------------
    | System Route Prefix
    |--------------------------------------------------------------------------
    */
    'system_route_prefix' => 'filament',

    /*
    |--------------------------------------------------------------------------
    | Auth Configuration
    |--------------------------------------------------------------------------
    | Ici on indique à Filament quel guard et quel modèle utiliser.
    */
    'auth' => [
        'guard' => 'web',
        'user_model' => Utilisateur::class, // ✅ ton modèle personnalisé
    ],

];
