<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | Ce fichier stocke les credentials des services tiers comme Mailgun,
    | Postmark, AWS, FedaPay etc. Cela permet aux packages d'avoir un
    | emplacement conventionnel pour retrouver ces informations.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel'              => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

   // ✅ Configuration FedaPay
'fedapay' => [
    'secret' => env('FEDAPAY_SECRET_KEY'),
    'public' => env('FEDAPAY_PUBLIC_KEY'),
    'env'    => env('FEDAPAY_ENVIRONMENT'),
],



];