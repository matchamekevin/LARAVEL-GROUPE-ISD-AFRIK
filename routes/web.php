<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;


// Serve la SPA React à la racine
Route::view('/', 'app');

// Endpoint de status pour vérification
Route::get('/status', function () {
    return response()->json([
        'service' => 'ISD AFRIK Backend API',
        'status' => 'ok',
    ]);
});

// Catch-all : laisser la SPA gérer les routes front (ex: /produits, /produits/123)
// Charger les routes d'authentification (Breeze) avant le catch-all SPA
if (file_exists(__DIR__ . '/auth.php')) {
    require __DIR__ . '/auth.php';
}

// Catch-all : laisser la SPA gérer les routes front (ex: /produits, /produits/123)
Route::view('/{any}', 'app')->where('any', '.*');

// Route de développement pour servir l'application React depuis Blade
Route::view('/app', 'app');
Route::view('/app/{any}', 'app')->where('any', '.*');

Route::get('/reset-password/{token}', function (Request $request, string $token) {
    $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
    $email = $request->query('email');

    $target = $frontendUrl . '/reset-password/' . $token;

    if ($email) {
        $target .= '?email=' . urlencode($email);
    }

    return redirect()->away($target);
})->name('password.reset');

// ✅ Route de test pour vérifier la session utilisateur
Route::get('/test-user', function () {
    return auth()->check() ? auth()->user()->getUserName() : 'Aucun utilisateur connecté';
});

Route::post('/logout', function () {
    Auth::logout(); // ✅ déconnecte l'utilisateur
    request()->session()->invalidate(); // ✅ détruit la session
    request()->session()->regenerateToken(); // ✅ évite les erreurs CSRF

    return redirect('/admin/login'); // ✅ redirige vers la page de login
})->name('logout');



Route::get('/test-notif', function () {
    $user = \App\Models\User::first();
    $user->notify(new \App\Notifications\BienvenueNotification());
    return "Notification envoyée";
});

