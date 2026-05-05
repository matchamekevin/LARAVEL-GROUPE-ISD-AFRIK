<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ManifestController;

// ======================================================
// 🔄 AUTO-REFRESH MANIFEST (admin only)
// ======================================================
Route::middleware(['auth:sanctum', 'isAdmin'])->group(function () {
    Route::post('/admin/refresh-manifest', [ManifestController::class, 'refresh']);
});
