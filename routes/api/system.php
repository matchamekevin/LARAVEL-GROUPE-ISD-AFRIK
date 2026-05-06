<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ManifestController;
use App\Http\Controllers\ContentVersionController;

// ======================================================
// 📡 VERSION DES DONNEES (public)
// ======================================================
Route::get('/content-version', [ContentVersionController::class, 'show']);

// ======================================================
// 🔄 AUTO-REFRESH MANIFEST (admin only)
// ======================================================
Route::middleware(['auth:sanctum', 'isAdmin'])->group(function () {
    Route::post('/admin/refresh-manifest', [ManifestController::class, 'refresh']);
});
