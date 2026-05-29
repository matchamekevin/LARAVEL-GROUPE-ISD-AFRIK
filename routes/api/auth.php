<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\CommandeController;
use App\Http\Controllers\FormationController;
use Illuminate\Support\Facades\Route;

// ======================================================
// 🔓 AUTH — ROUTES PUBLIQUES
// ======================================================
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/verify-2fa', [AuthController::class, 'verify2FA'])->middleware('throttle:5,1');
    Route::post('/resend-2fa', [AuthController::class, 'resend2FACode'])->middleware('throttle:3,1');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink'])->middleware('throttle:3,1');
    Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword'])->middleware('throttle:5,1');
    Route::get('/{id}/avatar', [ProfileController::class, 'avatarImage']);
});

// ======================================================
// 🔐 AUTH — ROUTES PROTÉGÉES
// ======================================================
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'profile']);
    Route::put('/update-profile', [ProfileController::class, 'updateProfile']);
    Route::post('/change-password', [ProfileController::class, 'changePassword']);
    Route::delete('/delete-account', [ProfileController::class, 'deleteSelf']);
    Route::post('/update-avatar', [ProfileController::class, 'updateAvatar']);
});

// ======================================================
// 👤 ROUTES CLIENT
// ======================================================
Route::middleware(['auth:sanctum', 'isClient'])->prefix('client')->group(function () {
    Route::get('/dashboard', fn () => response()->json(['message' => 'Bienvenue client']));
    Route::get('/mes-commandes', [CommandeController::class, 'mesCommandes']);
    Route::get('/mes-inscriptions', [FormationController::class, 'mesInscriptions']);
});
