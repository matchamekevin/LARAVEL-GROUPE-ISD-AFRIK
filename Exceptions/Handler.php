<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Symfony\Component\Routing\Exception\RouteNotFoundException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        // ✅ Gérer RouteNotFoundException (quand la route 'login' n'existe pas)
        $this->renderable(function (RouteNotFoundException $e, $request) {
            if ($request->is('admin/*') || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non authentifié. Veuillez vous connecter.',
                    'error' => 'Unauthenticated'
                ], 401);
            }
        });

        // ✅ Gérer AuthenticationException
        $this->renderable(function (AuthenticationException $e, $request) {
            if ($request->is('admin/*') || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non authentifié. Veuillez vous connecter.',
                    'error' => 'Unauthenticated'
                ], 401);
            }
        });
    }

    /**
     * Convert an authentication exception into a response.
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        // Pour les routes API et admin, retourner JSON
        if ($request->expectsJson() || $request->is('admin/*') || $request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié. Veuillez vous connecter.',
                'error' => 'Unauthenticated'
            ], 401);
        }

        // Pour les autres routes, rediriger vers la page d'accueil
        return redirect('/');
    }
}