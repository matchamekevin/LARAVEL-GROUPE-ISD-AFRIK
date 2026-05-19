<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$dir = public_path('storage/categories');
$files = glob($dir . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE);
$matched = 0;

foreach ($files as $path) {
    $name = pathinfo($path, PATHINFO_FILENAME);
    if (!preg_match('/^cat(\d+)_/', $name, $m)) {
        echo "SKIP: {$name} (no ID pattern)\n";
        continue;
    }

    $id = (int) $m[1];
    $cat = DB::table('categories_produits')->where('id_categorie', $id)->first();
    if (!$cat) {
        echo "SKIP: cat{$id} not found in DB\n";
        continue;
    }

    $binary = file_get_contents($path);
    $mime = mime_content_type($path) ?: 'image/jpeg';
    $base64 = base64_encode($binary);

    DB::table('categories_produits')
        ->where('id_categorie', $id)
        ->update([
            'image_data' => $base64,
            'image_mime' => $mime,
        ]);

    $matched++;
    if ($matched % 20 === 0) {
        echo "Progress: {$matched}/" . count($files) . "\n";
    }
}

echo "DONE: {$matched} images encoded and stored\n";
