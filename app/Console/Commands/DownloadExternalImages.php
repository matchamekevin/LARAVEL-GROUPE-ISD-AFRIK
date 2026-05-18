<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class DownloadExternalImages extends Command
{
    protected $signature = 'images:download-external';
    protected $description = 'Download all external images to local storage';

    public function handle()
    {
        $this->info('Downloading external images to local storage...');

        $storageDir = storage_path('app/public');
        $categoriesDir = $storageDir . '/categories';
        $produitsDir = $storageDir . '/produits';

        if (!is_dir($categoriesDir)) mkdir($categoriesDir, 0755, true);
        if (!is_dir($produitsDir)) mkdir($produitsDir, 0755, true);

        // Fix remaining categories
        $categories = DB::table('categories_produits')
            ->whereNotNull('image')
            ->where('image', 'not like', '/storage%')
            ->where('image', 'not like', 'https://prolific-besottedly-lissette.ngrok-free.dev%')
            ->where('image', '!=', '')
            ->get();

        $this->info("Categories to fix: {$categories->count()}");

        foreach ($categories as $cat) {
            $url = $cat->image;
            $this->line("  Cat #{$cat->id_categorie}: {$cat->nom}");

            if (str_starts_with($url, '/storage/geovision-categories/')) {
                $filename = basename($url);
                $localFile = $storageDir . '/geovision-categories/' . $filename;
                if (file_exists($localFile)) {
                    $newUrl = "/storage/geovision-categories/{$filename}";
                    DB::table('categories_produits')
                        ->where('id_categorie', $cat->id_categorie)
                        ->update(['image' => $newUrl, 'image_url' => $newUrl]);
                    $this->line("    -> Already exists: {$newUrl}");
                    continue;
                }
                // Fall through to try download
            }

            if (str_starts_with($url, '/images/geovision/')) {
                $localFile = public_path(ltrim($url, '/'));
                if (file_exists($localFile)) {
                    $ext = pathinfo($url, PATHINFO_EXTENSION) ?: 'webp';
                    $newName = "cat{$cat->id_categorie}_" . Str::random(8) . ".{$ext}";
                    copy($localFile, $categoriesDir . '/' . $newName);
                    $newUrl = "/storage/categories/{$newName}";
                    DB::table('categories_produits')
                        ->where('id_categorie', $cat->id_categorie)
                        ->update(['image' => $newUrl, 'image_url' => $newUrl]);
                    $this->line("    -> Copied local: {$newUrl}");
                    continue;
                }
                $this->warn("    -> Local file not found: {$url}");
                // Fallback to parent category image
                $parent = DB::table('categories_produits')
                    ->where('id_categorie', $cat->parent_id)
                    ->value('image');
                if ($parent && !str_starts_with($parent, '/storage')) {
                    $url = $parent;
                } else {
                    // Use category image instead
                    continue;
                }
            }

            // Download external URL
            try {
                $response = Http::timeout(15)->withOptions([
                    'verify' => false,
                ])->get($url);

                if ($response->successful() && strlen($response->body()) > 500) {
                    $ext = 'jpg';
                    $contentType = $response->header('Content-Type');
                    if (str_contains($contentType, 'png')) $ext = 'png';
                    elseif (str_contains($contentType, 'webp')) $ext = 'webp';
                    elseif (str_contains($contentType, 'gif')) $ext = 'gif';
                    elseif (str_contains($contentType, 'svg')) $ext = 'svg';

                    $newName = "cat{$cat->id_categorie}_" . Str::random(8) . ".{$ext}";
                    file_put_contents($categoriesDir . '/' . $newName, $response->body());
                    $newUrl = "/storage/categories/{$newName}";
                    DB::table('categories_produits')
                        ->where('id_categorie', $cat->id_categorie)
                        ->update(['image' => $newUrl, 'image_url' => $newUrl]);
                    $this->line("    -> Downloaded: {$newUrl} (" . strlen($response->body()) . " bytes)");
                } else {
                    $this->warn("    -> Failed (HTTP {$response->status()}): {$url}");
                }
            } catch (\Exception $e) {
                $this->warn("    -> Error: {$e->getMessage()}");
            }
        }

        // Now fix product images
        $problemDomains = [
            'unsplash', 'eaton', 'mikrotik', 'fortinet', 'tp-link', 'hikvision',
            'synology', 'grandstream', 'yealink', 'bhphotovideo', 'dji', 'senetic',
            'coptrz', 'victron', 'autelrobotics', 'paxtechnology', 'verifone', 'dl.ubnt',
            'apc.com', 'hp', 'dell', 'qnap', 'ingenico', 'sunmi', 'hpe',
        ];

        $productImages = DB::table('images')
            ->where('imageable_type', 'PRODUIT')
            ->where(function ($q) use ($problemDomains) {
                foreach ($problemDomains as $domain) {
                    $q->orWhere('url', 'like', "%{$domain}%");
                }
            })
            ->get();

        $this->info("Product images to fix: {$productImages->count()}");

        foreach ($productImages as $img) {
            $url = $img->url;
            $this->line("  Image #{$img->id_image} for product #{$img->imageable_id}");

            try {
                $response = Http::timeout(15)->withOptions([
                    'verify' => false,
                    'headers' => [
                        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    ]
                ])->get($url);

                if ($response->successful() && strlen($response->body()) > 500) {
                    $ext = 'jpg';
                    $contentType = $response->header('Content-Type');
                    if (str_contains($contentType, 'png')) $ext = 'png';
                    elseif (str_contains($contentType, 'webp')) $ext = 'webp';
                    elseif (str_contains($contentType, 'gif')) $ext = 'gif';
                    elseif (str_contains($contentType, 'svg')) $ext = 'svg';
                    elseif (str_contains($contentType, 'jpeg')) $ext = 'jpg';

                    $newName = "prod{$img->imageable_id}_" . Str::random(8) . ".{$ext}";
                    file_put_contents($produitsDir . '/' . $newName, $response->body());
                    $newUrl = "/storage/produits/{$newName}";
                    DB::table('images')
                        ->where('id_image', $img->id_image)
                        ->update(['url' => $newUrl, 'path' => $newUrl]);
                    $this->line("    -> Downloaded: {$newUrl}");
                } else {
                    $this->warn("    -> Failed (HTTP {$response->status()}): " . substr($url, 0, 80));
                }
            } catch (\Exception $e) {
                $this->warn("    -> Error: {$e->getMessage()}");
            }
        }

        // Summary
        $remainingCats = DB::table('categories_produits')
            ->whereNotNull('image')
            ->where('image', 'not like', '/storage%')
            ->where('image', 'not like', 'https://prolific-besottedly-lissette.ngrok-free.dev%')
            ->where('image', '!=', '')
            ->count();

        $remainingProdImages = DB::table('images')
            ->where('imageable_type', 'PRODUIT')
            ->where(function ($q) use ($problemDomains) {
                foreach ($problemDomains as $domain) {
                    $q->orWhere('url', 'like', "%{$domain}%");
                }
            })
            ->count();

        $this->info("Done! Remaining: {$remainingCats} categories, {$remainingProdImages} product images");
    }
}
