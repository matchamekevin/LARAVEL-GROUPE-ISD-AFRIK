<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\UtilisateurController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\CategorieProduitController;
use App\Http\Controllers\CommandeController;
use App\Http\Controllers\FormationController;
use App\Http\Controllers\PaysController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\CommentaireController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RevendeurDemandeController;
use App\Http\Controllers\ContactMessageController;

// ======================================================
// 🏠 ROUTES DE TEST
// ======================================================
Route::get('/test', fn() => response()->json(['message' => 'API OK']));
Route::get('/ping', fn() => response()->json(['message' => 'pong']));

// ======================================================
// 🔓 AUTH — ROUTES PUBLIQUES
// ======================================================
Route::prefix('auth')->group(function () {
    Route::post('/register',        [UtilisateurController::class, 'register']);
    Route::post('/login',           [UtilisateurController::class, 'login']);
    Route::post('/verify-2fa',      [UtilisateurController::class, 'verify2FA']);
    Route::post('/resend-2fa',      [UtilisateurController::class, 'resend2FACode']);
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
    Route::post('/reset-password',  [ForgotPasswordController::class, 'resetPassword']);
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

// ======================================================
// 🛒 PRODUITS — ROUTES PUBLIQUES
// ======================================================
Route::prefix('produits')->group(function () {
    Route::get('/vedette',           [ProduitController::class, 'vedette']);
    Route::get('/nouveaux',          [ProduitController::class, 'nouveaux']);
    Route::get('/promotions',        [ProduitController::class, 'promotions']);
    Route::get('/recherche',         [ProduitController::class, 'recherche']);
    Route::get('/marques',           [ProduitController::class, 'marques']);
    Route::get('/slug/{slug}',       [ProduitController::class, 'showBySlug']);
    Route::get('/',                  [ProduitController::class, 'index']);
    Route::get('/{id}',              [ProduitController::class, 'show'])->where('id', '[0-9]+');
});

// ======================================================
// 🗂️ CATÉGORIES PRODUITS — ROUTES PUBLIQUES
// ======================================================
Route::prefix('categories-produits')->group(function () {
    Route::get('/',       [CategorieProduitController::class, 'index']);
    Route::get('/{id}',   [CategorieProduitController::class, 'show'])->where('id', '[0-9]+');
});

// ======================================================
// 🛒 PRODUITS + CATÉGORIES — ROUTES ADMIN
// ======================================================
Route::middleware(['auth:sanctum', 'isAdmin'])->group(function () {
    // 🗂️ CATÉGORIES (admin)
    Route::get('/admin/categories-produits',         [CategorieProduitController::class, 'index']);
    Route::get('/admin/categories-produits/{id}',    [CategorieProduitController::class, 'show'])->where('id', '[0-9]+');
    // 📦 PRODUITS (admin)
    Route::get('/admin/produits',                     [ProduitController::class, 'adminIndex']);
    Route::get('/admin/produits/{id}',                [ProduitController::class, 'show'])->where('id', '[0-9]+');
    Route::post('/produits',                          [ProduitController::class, 'store']);
    Route::put('/produits/{id}',                      [ProduitController::class, 'update']);
    Route::delete('/produits/{id}',                   [ProduitController::class, 'destroy']);
    Route::patch('/produits/{id}/restore',            [ProduitController::class, 'restore']);
    Route::patch('/produits/{id}/stock',              [ProduitController::class, 'updateStock']);
    Route::patch('/produits/{id}/vedette',            [ProduitController::class, 'toggleVedette']);
    Route::post('/produits/{id}/images',              [ProduitController::class, 'uploadImages']);
    Route::delete('/produits/{id}/images/{imageId}',  [ProduitController::class, 'deleteImage']);

    Route::post('/categories-produits',               [CategorieProduitController::class, 'store']);
    Route::put('/categories-produits/{id}',           [CategorieProduitController::class, 'update']);
    Route::delete('/categories-produits/{id}',        [CategorieProduitController::class, 'destroy']);

    // 👤 GESTION UTILISATEURS (admin)
    Route::get('/utilisateurs',                      [UtilisateurController::class, 'index']);
    Route::get('/utilisateurs/{id}',                 [UtilisateurController::class, 'show'])->where('id', '[0-9]+');
    Route::put('/utilisateurs/{id}',                 [UtilisateurController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/utilisateurs/{id}',              [UtilisateurController::class, 'destroy'])->where('id', '[0-9]+');
    Route::patch('/utilisateurs/{id}/restore',       [UtilisateurController::class, 'restore'])->where('id', '[0-9]+');

    // 💳 PAIEMENTS (admin lecture)
    Route::get('/admin/paiements',                   [PaiementController::class, 'adminIndex']);
    Route::get('/admin/paiements/{id}',              [PaiementController::class, 'show'])->where('id', '[0-9]+');

    // 📦 COMMANDES (admin)
    Route::get('/admin/commandes',                   [CommandeController::class, 'adminIndex']);
    Route::get('/admin/commandes/{id}',              [CommandeController::class, 'adminShow'])->where('id', '[0-9]+');
    Route::patch('/admin/commandes/{id}/statut',     [CommandeController::class, 'adminUpdateStatus'])->where('id', '[0-9]+');

    // 📚 FORMATIONS (admin CRUD)
    Route::get('/admin/formations',                  [FormationController::class, 'index']);
    Route::post('/admin/formations',                 [FormationController::class, 'store']);
    Route::get('/admin/formations/{formation}',      [FormationController::class, 'show']);
    Route::put('/admin/formations/{formation}',      [FormationController::class, 'update']);
    Route::patch('/admin/formations/{formation}',    [FormationController::class, 'update']);
    Route::delete('/admin/formations/{formation}',   [FormationController::class, 'destroy']);

    // 📩 MESSAGES CONTACT (admin)
    Route::get('/admin/contact-messages',            [ContactMessageController::class, 'index']);
    Route::get('/admin/contact-messages/{id}',       [ContactMessageController::class, 'show'])->where('id', '[0-9]+');
    Route::patch('/admin/contact-messages/{id}/statut', [ContactMessageController::class, 'updateStatus'])->where('id', '[0-9]+');
    Route::delete('/admin/contact-messages/{id}',    [ContactMessageController::class, 'destroy'])->where('id', '[0-9]+');

    // 🤝 DEMANDES REVENDEURS (admin)
    Route::get('/admin/revendeur-demandes',          [RevendeurDemandeController::class, 'index']);
    Route::get('/admin/revendeur-demandes/{id}',     [RevendeurDemandeController::class, 'show'])->where('id', '[0-9]+');
    Route::patch('/admin/revendeur-demandes/{id}/statut', [RevendeurDemandeController::class, 'updateStatus'])->where('id', '[0-9]+');
    Route::delete('/admin/revendeur-demandes/{id}',  [RevendeurDemandeController::class, 'destroy'])->where('id', '[0-9]+');

    // 📧 NEWSLETTER (admin)
    Route::get('/admin/newsletter',                  [NewsletterController::class, 'index']);
    Route::get('/admin/newsletter/{id}',             [NewsletterController::class, 'show'])->where('id', '[0-9]+');
    Route::post('/admin/newsletter',                 [NewsletterController::class, 'store']);
    Route::put('/admin/newsletter/{id}',             [NewsletterController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/admin/newsletter/{id}',          [NewsletterController::class, 'destroy'])->where('id', '[0-9]+');

    // 🖼️ IMAGES (admin)
    Route::get('/admin/images',                      [ImageController::class, 'index']);
    Route::get('/admin/images/{id}',                 [ImageController::class, 'show'])->where('id', '[0-9]+');
    Route::post('/admin/images',                     [ImageController::class, 'store']);
    Route::put('/admin/images/{id}',                 [ImageController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/admin/images/{id}',              [ImageController::class, 'destroy'])->where('id', '[0-9]+');

    // 💬 COMMENTAIRES (admin)
    Route::get('/admin/commentaires',                [CommentaireController::class, 'index']);
    Route::get('/admin/commentaires/{id}',           [CommentaireController::class, 'show'])->where('id', '[0-9]+');
    Route::post('/admin/commentaires',               [CommentaireController::class, 'store']);
    Route::put('/admin/commentaires/{id}',           [CommentaireController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/admin/commentaires/{id}',        [CommentaireController::class, 'destroy'])->where('id', '[0-9]+');
});

// ======================================================
// 📚 FORMATIONS
// ======================================================
Route::get('formations/type/{type}',              [FormationController::class, 'getByType']);
Route::get('formations/categories/images',        [FormationController::class, 'getCategoryImages']);
Route::post('formations/full',                    [FormationController::class, 'storeWithRelations']);
Route::post('formations/{id}/register',           [FormationController::class, 'registerUser']);
Route::post('formations/{id}/images',             [FormationController::class, 'addImage']);
Route::post('formations/{id}/commentaires',       [FormationController::class, 'addCommentaire']);

Route::get('formations',                [FormationController::class, 'index']);
Route::post('formations',               [FormationController::class, 'store']);
Route::get('formations/{formation}',    [FormationController::class, 'show']);
Route::put('formations/{formation}',    [FormationController::class, 'update']);
Route::patch('formations/{formation}',  [FormationController::class, 'update']);
Route::delete('formations/{formation}', [FormationController::class, 'destroy']);

// ======================================================
// 💳 PAIEMENTS
// ======================================================

// ✅ Callbacks FedaPay PUBLICS — avant le groupe auth:sanctum
// POST  = webhook FedaPay (serveur à serveur)
Route::post('/paiement/callback',  [PaiementController::class, 'callback'])->name('paiement.callback');
// GET   = redirection navigateur après paiement (?status=approved&id=xxx)
Route::get('/paiement/callback',   [PaiementController::class, 'callbackReturn'])->name('paiement.callback.return');

Route::post('/paiement/{idPaiement}/init', [FormationController::class, 'initPaiement'])->name('paiement.init');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/formations/{id}/paiement', [PaiementController::class, 'payFormation'])->name('paiement.formation');
    Route::post('/paiement/test',            [PaiementController::class, 'testPaiement'])->name('paiement.test');
    Route::get('/paiement/{id}/facture',     [PaiementController::class, 'facture'])->name('paiement.facture');

    // ✅ Route utilisée par FacturePage React pour afficher le reçu
    Route::get('/paiement/{id}',             [PaiementController::class, 'show'])->name('paiement.show');
});

// ======================================================
// 🖼️ IMAGES
// ======================================================
Route::prefix('images')->group(function () {
    Route::get('/',                [ImageController::class, 'index']);
    Route::post('/',               [ImageController::class, 'store']);
    Route::get('/{id}',            [ImageController::class, 'show']);
    Route::put('/{id}',            [ImageController::class, 'update']);
    Route::delete('/{id}',         [ImageController::class, 'destroy']);
    Route::patch('/{id}/restore',  [ImageController::class, 'restore']);
    Route::delete('/{id}/force',   [ImageController::class, 'forceDelete']);
});

// ======================================================
// 💬 COMMENTAIRES
// ======================================================
Route::prefix('commentaires')->group(function () {
    Route::get('/',                [CommentaireController::class, 'index']);
    Route::post('/',               [CommentaireController::class, 'store']);
    Route::get('/{id}',            [CommentaireController::class, 'show']);
    Route::put('/{id}',            [CommentaireController::class, 'update']);
    Route::delete('/{id}',         [CommentaireController::class, 'destroy']);
    Route::patch('/{id}/restore',  [CommentaireController::class, 'restore']);
    Route::delete('/{id}/force',   [CommentaireController::class, 'forceDelete']);
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
Route::post('/newsletter',         [NewsletterController::class, 'store']);
Route::get('/newsletter',          [NewsletterController::class, 'index']);
Route::get('/newsletter/{id}',     [NewsletterController::class, 'show']);
Route::put('/newsletter/{id}',     [NewsletterController::class, 'update']);
Route::delete('/newsletter/{id}',  [NewsletterController::class, 'destroy']);

// ======================================================
// 🤝 DEMANDES REVENDEURS
// ======================================================
Route::post('/revendeur-demandes', [RevendeurDemandeController::class, 'store']);

// ======================================================
// 📩 CONTACT (public)
// ======================================================
Route::post('/contact-messages', [ContactMessageController::class, 'store']);