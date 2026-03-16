<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Allow longer request execution time during local development
@set_time_limit(300);

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

// Quick dev CORS handling: if the request targets the API, set CORS headers
// Uses CORS_ALLOWED_ORIGINS environment variable when available.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$rawAllowed = getenv('CORS_ALLOWED_ORIGINS') ?: ($_ENV['CORS_ALLOWED_ORIGINS'] ?? '');
$allowed = [];
if ($rawAllowed === '*' || $rawAllowed === '') {
    $allowed = ['*'];
} else {
    $allowed = array_map('trim', explode(',', $rawAllowed));
}
if (strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') === 0) {
    if (in_array('*', $allowed)) {
        header('Access-Control-Allow-Origin: *');
    } elseif ($origin && in_array($origin, $allowed)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With, Authorization, X-CSRF-TOKEN');
    header('Access-Control-Allow-Credentials: true');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

$app->handleRequest(Request::capture());
