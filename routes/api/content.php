<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PaysController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\CommentaireController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RevendeurDemandeController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\HomeMarketingCardController;
use App\Http\Controllers\HomeTestimonialController;
use App\Http\Controllers\HomeCollaboratorController;
use App\Http\Controllers\HomePartnerController;

// ======================================================
// 🖼️ IMAGES
// ======================================================
Route::prefix('images')->group(function () {
    Route::get('/',                [ImageController::class, 'index']);
    Route::get('/{id}',            [ImageController::class, 'show']);
    Route::middleware(['auth:sanctum', 'isAdmin'])->post('/', [ImageController::class, 'store']);
    Route::middleware(['auth:sanctum', 'isAdmin'])->put('/{id}', [ImageController::class, 'update']);
    Route::middleware(['auth:sanctum', 'isAdmin'])->delete('/{id}', [ImageController::class, 'destroy']);
    Route::middleware(['auth:sanctum', 'isAdmin'])->patch('/{id}/restore', [ImageController::class, 'restore']);
    Route::middleware(['auth:sanctum', 'isAdmin'])->delete('/{id}/force', [ImageController::class, 'forceDelete']);
});

// ======================================================
// 💬 COMMENTAIRES
// ======================================================
Route::prefix('commentaires')->group(function () {
    Route::get('/',                [CommentaireController::class, 'index']);
    Route::get('/{id}',            [CommentaireController::class, 'show']);
    Route::middleware('auth:sanctum')->post('/', [CommentaireController::class, 'store']);
    Route::middleware(['auth:sanctum', 'isAdmin'])->put('/{id}', [CommentaireController::class, 'update']);
    Route::middleware(['auth:sanctum', 'isAdmin'])->delete('/{id}', [CommentaireController::class, 'destroy']);
});

// ======================================================
// 🔔 NOTIFICATIONS
// ======================================================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications',                  [NotificationController::class, 'index']);
    Route::get('/notifications/unread',           [NotificationController::class, 'unread']);
    Route::post('/notifications/{id}/read',       [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all',        [NotificationController::class, 'markAllAsRead']);
});

// ======================================================
// 📧 NEWSLETTER
// ======================================================
Route::post('/newsletter', [NewsletterController::class, 'store']);
Route::middleware(['auth:sanctum', 'isAdmin'])->get('/newsletter', [NewsletterController::class, 'index']);
Route::middleware(['auth:sanctum', 'isAdmin'])->get('/newsletter/{id}', [NewsletterController::class, 'show']);
Route::middleware(['auth:sanctum', 'isAdmin'])->put('/newsletter/{id}', [NewsletterController::class, 'update']);
Route::middleware(['auth:sanctum', 'isAdmin'])->delete('/newsletter/{id}', [NewsletterController::class, 'destroy']);

// ======================================================
// 🌍 PAYS
// ======================================================
Route::get('/pays', [PaysController::class, 'index']);
Route::get('/pays/{id}', [PaysController::class, 'show'])->where('id', '[0-9]+');

// ======================================================
// 🤝 DEMANDES REVENDEURS
// ======================================================
Route::post('/revendeur-demandes', [RevendeurDemandeController::class, 'store']);

// ======================================================
// 📩 CONTACT (public)
// ======================================================
Route::post('/contact-messages', [ContactMessageController::class, 'store']);

// ======================================================
// 🏠 MARKETING HOMEPAGE CARDS (public)
// ======================================================
Route::get('/home-marketing-cards', [HomeMarketingCardController::class, 'index']);

// ======================================================
// 🗣️ AVIS CLIENTS HOMEPAGE (public)
// ======================================================
Route::get('/home-testimonials', [HomeTestimonialController::class, 'index']);

// ======================================================
// 🤝 COLLABORATEURS HOMEPAGE (public)
// ======================================================
Route::get('/home-collaborators', [HomeCollaboratorController::class, 'index']);

// ======================================================
// 🤝 PARTENAIRES HOMEPAGE (public)
// ======================================================
Route::get('/home-partners', [HomePartnerController::class, 'index']);
