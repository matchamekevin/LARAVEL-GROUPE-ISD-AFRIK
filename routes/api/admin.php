<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\UtilisateurController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\CategorieProduitController;
use App\Http\Controllers\CommandeController;
use App\Http\Controllers\FormationController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\CommentaireController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\RevendeurDemandeController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\GeovisionCatalogController;
use App\Http\Controllers\HomeMarketingCardController;
use App\Http\Controllers\HomeTestimonialController;
use App\Http\Controllers\HomeCollaboratorController;
use App\Http\Controllers\HomePartnerController;
use App\Http\Controllers\AdminActivityController;
use App\Http\Controllers\DevisPrestationController;

// ======================================================
// 🔐 ROUTES ADMIN
// ======================================================
Route::middleware(['auth:sanctum', 'isAdmin'])->group(function () {
    // 🗂️ CATÉGORIES (admin)
    Route::get('/admin/categories-produits',         [CategorieProduitController::class, 'index']);
    Route::get('/admin/categories-produits/{id}',    [CategorieProduitController::class, 'show'])->where('id', '[0-9]+');
    Route::post('/admin/categories-produits/bootstrap-ingenierie', [CategorieProduitController::class, 'bootstrapIngenierie']);

    // 📦 PRODUITS (admin)
    Route::get('/admin/produits',                     [ProduitController::class, 'adminIndex']);
    Route::get('/admin/produits/{id}',                [ProduitController::class, 'show'])->where('id', '[0-9]+');
    Route::post('/admin/geovision/sync',              [GeovisionCatalogController::class, 'sync']);
    Route::post('/produits',                          [ProduitController::class, 'store']);
    Route::put('/produits/{id}',                      [ProduitController::class, 'update']);
    Route::delete('/produits/{id}',                   [ProduitController::class, 'destroy']);
    Route::delete('/produits/{id}/force',             [ProduitController::class, 'forceDestroy']);
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
    Route::post('/utilisateurs/admin-adjoint',       [UtilisateurController::class, 'storeAdminAdjoint'])->middleware('isSuperAdmin');

    // 💳 PAIEMENTS (admin lecture)
    Route::get('/admin/paiements',                   [PaiementController::class, 'adminIndex']);
    Route::get('/admin/paiements/{id}',              [PaiementController::class, 'show'])->where('id', '[0-9]+');

    // 📝 ACTIVITÉS RÉCENTES (audit + admin actions)
    Route::get('/admin/dashboard',                 [AdminActivityController::class, 'dashboard']);
    Route::get('/admin/activities',                  [AdminActivityController::class, 'index']);

    // 📦 COMMANDES (admin)
    Route::get('/admin/commandes',                   [CommandeController::class, 'adminIndex']);
    Route::get('/admin/commandes/{id}',              [CommandeController::class, 'adminShow'])->where('id', '[0-9]+');
    Route::patch('/admin/commandes/{id}/statut',     [CommandeController::class, 'adminUpdateStatus'])->where('id', '[0-9]+');
    Route::patch('/admin/commandes/{id}/livraison-statut', [CommandeController::class, 'adminUpdateLivraisonStatus'])->where('id', '[0-9]+');

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

    // 📋 DEVIS PRESTATIONS (admin)
    Route::get('/admin/devis-prestations',            [DevisPrestationController::class, 'index']);
    Route::get('/admin/devis-prestations/{id}',       [DevisPrestationController::class, 'show'])->where('id', '[0-9]+');
    Route::patch('/admin/devis-prestations/{id}/statut', [DevisPrestationController::class, 'updateStatus'])->where('id', '[0-9]+');
    Route::delete('/admin/devis-prestations/{id}',    [DevisPrestationController::class, 'destroy'])->where('id', '[0-9]+');

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

    // 🏠 MARKETING HOMEPAGE CARDS (admin)
    Route::get('/admin/home-marketing-cards',        [HomeMarketingCardController::class, 'adminIndex']);
    Route::post('/admin/home-marketing-cards',       [HomeMarketingCardController::class, 'store']);
    Route::put('/admin/home-marketing-cards/{card}', [HomeMarketingCardController::class, 'update']);
    Route::delete('/admin/home-marketing-cards/{card}', [HomeMarketingCardController::class, 'destroy']);

    // 🗣️ AVIS CLIENTS HOMEPAGE (admin)
    Route::get('/admin/home-testimonials',               [HomeTestimonialController::class, 'adminIndex']);
    Route::post('/admin/home-testimonials',              [HomeTestimonialController::class, 'store']);
    Route::put('/admin/home-testimonials/{testimonial}', [HomeTestimonialController::class, 'update']);
    Route::delete('/admin/home-testimonials/{testimonial}', [HomeTestimonialController::class, 'destroy']);

    // 🤝 COLLABORATEURS HOMEPAGE (admin)
    Route::get('/admin/home-collaborators',                [HomeCollaboratorController::class, 'adminIndex']);
    Route::post('/admin/home-collaborators',               [HomeCollaboratorController::class, 'store']);
    Route::put('/admin/home-collaborators/{collaborator}', [HomeCollaboratorController::class, 'update']);
    Route::delete('/admin/home-collaborators/{collaborator}', [HomeCollaboratorController::class, 'destroy']);

    // 🤝 PARTENAIRES HOMEPAGE (admin)
    Route::get('/admin/home-partners',              [HomePartnerController::class, 'adminIndex']);
    Route::post('/admin/home-partners',             [HomePartnerController::class, 'store']);
    Route::put('/admin/home-partners/{partner}',    [HomePartnerController::class, 'update']);
    Route::delete('/admin/home-partners/{partner}', [HomePartnerController::class, 'destroy']);

    // 🖼️ IMAGES (admin)
    Route::get('/admin/images',                      [ImageController::class, 'index']);
    Route::get('/admin/images/{id}',                 [ImageController::class, 'show'])->where('id', '[0-9]+');
    Route::post('/admin/images/upload',              [ImageController::class, 'upload']);
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
