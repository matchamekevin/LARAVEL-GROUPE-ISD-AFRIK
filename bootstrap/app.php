<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\IsClient;
use App\Http\Middleware\IsAdmin;
use App\Http\Middleware\IsSuperAdmin;
use App\Http\Middleware\RedirectTo2FA;
use App\Http\Middleware\SecurityHeaders;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(SecurityHeaders::class);

        $middleware->alias([
            'isClient'      => IsClient::class,
            'isAdmin'       => IsAdmin::class,
            'isSuperAdmin'  => IsSuperAdmin::class,
            'redirectTo2FA' => RedirectTo2FA::class,
        ]);

        $middleware->api([
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (\Throwable $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Erreur lors de la connexion',
                    'error' => get_class($e).': '.$e->getMessage(),
                    'file' => $e->getFile().':'.$e->getLine(),
                ], 500);
            }
        });
    })
    ->create();
