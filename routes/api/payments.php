<?php

use App\Http\Controllers\FormationController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\ProduitController;
use Illuminate\Support\Facades\Route;

// ======================================================
// 💳 PAIEMENTS
// ======================================================

// ✅ Callbacks FedaPay PUBLICS — avant le groupe auth:sanctum
// POST  = webhook FedaPay (serveur à serveur)
Route::post('/paiement/callback', [PaiementController::class, 'callback'])->name('paiement.callback');
// GET   = redirection navigateur après paiement (?status=approved&id=xxx)
Route::get('/paiement/callback', [PaiementController::class, 'callbackReturn'])->name('paiement.callback.return');

// ✅ Callback FedaPay produit (paiement simple) — public
Route::match(['get', 'post'], '/paiements-produit/callback', [ProduitController::class, 'callbackPaiementProduit'])
    ->name('paiement.produit.callback');

Route::middleware('auth:sanctum')
    ->post('/paiement/{idPaiement}/init', [FormationController::class, 'initPaiement'])
    ->name('paiement.init');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/produits/paiement', [PaiementController::class, 'payProduits'])->name('paiement.produits');
    Route::post('/formations/{id}/paiement', [PaiementController::class, 'payFormation'])->name('paiement.formation');
    Route::post('/paiement/test', [PaiementController::class, 'testPaiement'])->name('paiement.test');
    Route::get('/paiement/{id}/facture', [PaiementController::class, 'facture'])->name('paiement.facture');
    Route::get('/paiement/{id}', [PaiementController::class, 'show'])->name('paiement.show');

    // 💳 Paiement produit simple
    Route::post('/produits/{id}/acheter', [ProduitController::class, 'acheterProduit']);
    Route::post('/paiements-produit/{idPaiement}/init', [ProduitController::class, 'initPaiementProduit']);
});
