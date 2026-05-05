<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FormationController;
use App\Http\Controllers\PaiementController;

// ======================================================
// 💳 PAIEMENTS
// ======================================================

// ✅ Callbacks FedaPay PUBLICS — avant le groupe auth:sanctum
// POST  = webhook FedaPay (serveur à serveur)
Route::post('/paiement/callback', [PaiementController::class, 'callback'])->name('paiement.callback');
// GET   = redirection navigateur après paiement (?status=approved&id=xxx)
Route::get('/paiement/callback', [PaiementController::class, 'callbackReturn'])->name('paiement.callback.return');

Route::middleware('auth:sanctum')
    ->post('/paiement/{idPaiement}/init', [FormationController::class, 'initPaiement'])
    ->name('paiement.init');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/produits/paiement', [PaiementController::class, 'payProduits'])->name('paiement.produits');
    Route::post('/formations/{id}/paiement', [PaiementController::class, 'payFormation'])->name('paiement.formation');
    Route::post('/paiement/test', [PaiementController::class, 'testPaiement'])->name('paiement.test');
    Route::get('/paiement/{id}/facture', [PaiementController::class, 'facture'])->name('paiement.facture');

    // ✅ Route utilisée par FacturePage React pour afficher le reçu
    Route::get('/paiement/{id}', [PaiementController::class, 'show'])->name('paiement.show');
});
