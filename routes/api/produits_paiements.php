<?php

use App\Http\Controllers\ProduitController;
use Illuminate\Support\Facades\Route;

Route::match(['get', 'post'], '/paiements-produit/callback', [ProduitController::class, 'callbackPaiementProduit'])
    ->name('paiement.produit.callback');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/produits/{id}/acheter', [ProduitController::class, 'acheterProduit']);
    Route::post('/paiements-produit/{idPaiement}/init', [ProduitController::class, 'initPaiementProduit']);
});
