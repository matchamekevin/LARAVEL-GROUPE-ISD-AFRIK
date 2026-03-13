#!/usr/bin/env php
<?php
$basePath = __DIR__;
require $basePath.'/vendor/autoload.php';
$app = require_once $basePath.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use DB;
use Illuminate\Support\Facades\DB as DatabaseFacade;

try {
    $count = DatabaseFacade::table('formations')->count();
    echo "✅ Total formations: " . $count . "\n";
    
    if($count > 0) {
        $first = DatabaseFacade::table('formations')->first();
        echo "✅ Première formation: " . $first->titre . "\n";
    } else {
        echo "⚠️ Aucune formation trouvée. Exécution du seeder en cours...\n";
        // Run the seeder
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'FormationSeeder']);
        echo \Illuminate\Support\Facades\Artisan::output();
    }
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
