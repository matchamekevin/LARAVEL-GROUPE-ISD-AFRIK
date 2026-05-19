<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    public function up(): void
    {
        $path = database_path('data/category_images.json.gz');
        if (!file_exists($path)) {
            Log::info('[Migration] category_images.json.gz not found — skip');
            return;
        }

        $gz = file_get_contents($path);
        $json = gzdecode($gz);
        if ($json === false) {
            Log::warning('[Migration] Failed to decompress category_images.json.gz');
            return;
        }

        $images = json_decode($json, true);
        if (!is_array($images)) {
            Log::warning('[Migration] Invalid JSON in category_images.json.gz');
            return;
        }

        $updated = 0;
        foreach ($images as $id => $img) {
            $existing = DB::table('categories_produits')
                ->where('id_categorie', $id)
                ->whereNull('image_data')
                ->first();

            if (!$existing) {
                continue;
            }

            DB::table('categories_produits')
                ->where('id_categorie', $id)
                ->update([
                    'image_data' => $img['d'],
                    'image_mime' => $img['m'],
                ]);
            $updated++;
        }

        Log::info("[Migration] Imported {$updated} category images from data file");
    }

    public function down(): void
    {
    }
};
