<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    $count = DB::table('formations')->count();
    echo "✅ Total formations inserted: " . $count . "\n";
    
    // Afficher quelques formations
    $formations = DB::table('formations')->limit(3)->get();
    echo "\nPremières formations:\n";
    foreach ($formations as $f) {
        echo "- " . $f->titre . " (" . $f->prix . " FCFA)\n";
    }
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}
