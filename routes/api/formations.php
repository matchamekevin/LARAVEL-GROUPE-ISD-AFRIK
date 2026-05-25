<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FormationController;

// ======================================================
// 📚 FORMATIONS
// ======================================================
Route::get('formations/type/{type}',              [FormationController::class, 'getByType']);
Route::get('formations/categories/images',        [FormationController::class, 'getCategoryImages']);
Route::middleware(['auth:sanctum', 'isAdmin'])->post('formations/full', [FormationController::class, 'storeWithRelations']);
Route::middleware('auth:sanctum')->post('formations/{id}/register', [FormationController::class, 'registerUser']);
Route::middleware('auth:sanctum')->post('formations/{id}/commentaires', [FormationController::class, 'addCommentaire']);

Route::get('formations',                [FormationController::class, 'index']);
Route::middleware(['auth:sanctum', 'isAdmin'])->post('formations', [FormationController::class, 'store']);
Route::get('formations/catalogue',       [FormationController::class, 'downloadCatalogue']);
Route::get('formations/{formation}',    [FormationController::class, 'show']);
Route::middleware(['auth:sanctum', 'isAdmin'])->put('formations/{formation}', [FormationController::class, 'update']);
Route::middleware(['auth:sanctum', 'isAdmin'])->patch('formations/{formation}', [FormationController::class, 'update']);
Route::middleware(['auth:sanctum', 'isAdmin'])->delete('formations/{formation}', [FormationController::class, 'destroy']);
