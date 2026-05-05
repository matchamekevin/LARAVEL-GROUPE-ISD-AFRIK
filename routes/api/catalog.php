<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\CategorieProduitController;

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
    Route::get('/',            [CategorieProduitController::class, 'index']);
    Route::get('/slug/{slug}', [CategorieProduitController::class, 'showBySlug']);
    Route::get('/{id}',        [CategorieProduitController::class, 'show'])->where('id', '[0-9]+');
});
