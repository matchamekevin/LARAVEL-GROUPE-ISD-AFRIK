<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\UtilisateurController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\CommandeController;
use App\Http\Controllers\FormationController;

// ======================================================
// 🔓 AUTH — ROUTES PUBLIQUES
// ======================================================
Route::prefix('auth')->group(function () {
    Route::post('/register',        [UtilisateurController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login',           [UtilisateurController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/verify-2fa',      [UtilisateurController::class, 'verify2FA'])->middleware('throttle:5,1');
    Route::post('/resend-2fa',      [UtilisateurController::class, 'resend2FACode'])->middleware('throttle:3,1');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink'])->middleware('throttle:3,1');
    Route::post('/reset-password',  [ForgotPasswordController::class, 'resetPassword'])->middleware('throttle:5,1');
    Route::get('/{id}/avatar',      [UtilisateurController::class, 'avatarImage']);
});

// ======================================================
// 🔐 AUTH — ROUTES PROTÉGÉES
// ======================================================
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::post('/logout',           [UtilisateurController::class, 'logout']);
    Route::get('/profile',           [UtilisateurController::class, 'profile']);
    Route::put('/update-profile',    [UtilisateurController::class, 'updateProfile']);
    Route::post('/change-password',  [UtilisateurController::class, 'changePassword']);
    Route::delete('/delete-account', [UtilisateurController::class, 'deleteSelf']);
    Route::post('/update-avatar',    [UtilisateurController::class, 'updateAvatar']);
});

// ======================================================
// 👤 ROUTES CLIENT
// ======================================================
Route::middleware(['auth:sanctum', 'isClient'])->prefix('client')->group(function () {
    Route::get('/dashboard',         fn() => response()->json(['message' => 'Bienvenue client']));
    Route::get('/mes-commandes',     [CommandeController::class, 'mesCommandes']);
    Route::get('/mes-inscriptions',  [FormationController::class, 'mesInscriptions']);
});
