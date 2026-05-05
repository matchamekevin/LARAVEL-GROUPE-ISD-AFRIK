<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ManifestController;

// Serve la SPA React à la racine
Route::view('/', 'app');

// Route de compatibilité Breeze/tests
Route::get('/dashboard', function () {
    return redirect('/');
})->name('dashboard');

// Endpoint de status pour vérification
Route::get('/status', function () {
    return response()->json([
        'service' => 'ISD AFRIK Backend API',
        'status' => 'ok',
    ]);
});

// ===== AUTO-REFRESH MANIFEST =====
// Endpoint pour obtenir la version actuelle (utilisé par le système d'auto-refresh)
Route::get('/manifest.json', [ManifestController::class, 'show']);
// =================================

// Charger les routes d'authentification (Breeze) avant le catch-all SPA.
if (file_exists(__DIR__ . '/auth.php')) {
    require __DIR__ . '/auth.php';
}

// Front admin React dédié
Route::view('/admin', 'admin');
Route::view('/admin/{any}', 'admin')->where('any', '.*');

// Routes de compatibilité Breeze/profile (tests web)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Compatibilité ancienne URL temporaire
Route::redirect('/admin-react', '/admin');
Route::redirect('/admin-react/{any}', '/admin/{any}')->where('any', '.*');

// Catch-all : laisser la SPA gérer les routes front (ex: /produits, /produits/123).
Route::view('/{any}', 'app')->where('any', '.*');
