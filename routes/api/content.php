<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PaysController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\CommentaireController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RevendeurDemandeController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\DevisPrestationController;
use App\Http\Controllers\HomeMarketingCardController;
use App\Http\Controllers\HomeTestimonialController;
use App\Http\Controllers\HomeCollaboratorController;
use App\Http\Controllers\HomePartnerController;
use App\Http\Controllers\HomeGeovisionSectionController;
use App\Http\Controllers\ProjetController;
use App\Http\Controllers\CategorieProduitController;

// ======================================================
// 🖼️ IMAGES
// ======================================================
Route::prefix('images')->group(function () {
    Route::get('/',                [ImageController::class, 'index']);
    Route::get('/{id}/serve',      [ImageController::class, 'serve']);
    Route::get('/{id}',            [ImageController::class, 'show']);
    Route::middleware(['auth:sanctum', 'isAdmin'])->post('/', [ImageController::class, 'store']);
    Route::middleware(['auth:sanctum', 'isAdmin'])->put('/{id}', [ImageController::class, 'update']);
    Route::middleware(['auth:sanctum', 'isAdmin'])->delete('/{id}', [ImageController::class, 'destroy']);
    Route::middleware(['auth:sanctum', 'isAdmin'])->patch('/{id}/restore', [ImageController::class, 'restore']);
    Route::middleware(['auth:sanctum', 'isAdmin'])->delete('/{id}/force', [ImageController::class, 'forceDelete']);
});

// ======================================================
// 🖼️ IMAGE SERVE ROUTES (public)
// ======================================================
Route::get('/home-marketing-cards/{card}/image', [HomeMarketingCardController::class, 'image']);
Route::get('/home-testimonials/{testimonial}/image', [HomeTestimonialController::class, 'image']);
Route::get('/home-collaborators/{collaborator}/image', [HomeCollaboratorController::class, 'image']);
Route::get('/home-partners/{partner}/image', [HomePartnerController::class, 'image']);
Route::get('/home-geovision-sections/{section}/image', [HomeGeovisionSectionController::class, 'image']);

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
// 📋 DEVIS PRESTATIONS (public)
// ======================================================
Route::post('/devis-prestation', [DevisPrestationController::class, 'store']);

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

// ======================================================
// 🏠 GEOVISION HOMEPAGE SECTIONS (public)
// ======================================================
Route::get('/home-geovision-sections', [HomeGeovisionSectionController::class, 'index']);

// ======================================================
// 📁 PROJETS (public)
// ======================================================
Route::get('/projets', [ProjetController::class, 'index']);
Route::get('/projets/{projet}/image', [ProjetController::class, 'image']);
Route::get('/projets/{slug}', [ProjetController::class, 'show']);
