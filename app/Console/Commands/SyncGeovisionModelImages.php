<?php

namespace App\Console\Commands;

use App\Models\CategorieProduit;
use App\Models\Produit;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SyncGeovisionModelImages extends Command
{
    protected $signature = 'geovision:sync-model-images
        {categorySlug? : Slug de categorie GeoVision (optionnel)}
        {--limit= : Limiter le nombre de produits traites}
        {--dry-run : Simuler sans ecrire les fichiers/DB}
        {--force : Forcer le remplacement meme si une image locale existe deja}';

    protected $description = 'Recupere une image officielle par modele GeoVision, convertit en webp et met a jour la DB.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $categorySlug = $this->argument('categorySlug');

        if ($dryRun) {
            $this->warn('Mode dry-run actif: aucune ecriture disque/DB.');
        }

        $query = Produit::query()
            ->with(['categorie.parent', 'images'])
            ->whereHas('categorie', function ($builder) {
                $builder->where('segment', 'geovision');
            })
            ->orderBy('id_produit');

        if ($categorySlug) {
            $category = CategorieProduit::query()
                ->where('segment', 'geovision')
                ->where('slug', $categorySlug)
                ->first();

            if (!$category) {
                $this->error("Categorie GeoVision introuvable: {$categorySlug}");
                return self::FAILURE;
            }

            $categoryIds = $this->collectCategoryIds($category);
            $query->whereIn('id_categorie', $categoryIds);
        }

        if ($limit && $limit > 0) {
            $query->limit($limit);
        }

        $products = $query->get();

        if ($products->isEmpty()) {
            $this->warn('Aucun produit GeoVision a traiter.');
            return self::SUCCESS;
        }

        $this->info("Produits a traiter: {$products->count()}");

        $updated = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($products as $product) {
            $sourceUrl = data_get($product->specifications, 'source_url');

            if (!$sourceUrl) {
                $sourceUrl = $this->guessSourceUrl($product);
            }

            if (!$sourceUrl) {
                $this->line("- {$product->slug}: source_url manquant, ignore.");
                $skipped++;
                continue;
            }

            $existingLocal = $product->images
                ->pluck('url')
                ->filter(fn ($url) => Str::startsWith((string) $url, '/images/geovision/products/'))
                ->isNotEmpty();

            if ($existingLocal && !$force) {
                $this->line("- {$product->slug}: image locale deja presente (utiliser --force pour remplacer).");
                $skipped++;
                continue;
            }

            try {
                $imageUrl = $this->extractProductImageUrl($sourceUrl);

                if (!$imageUrl) {
                    $this->warn("- {$product->slug}: image non trouvee sur {$sourceUrl}");
                    $failed++;
                    continue;
                }

                $imageBinary = $this->downloadImage($imageUrl);

                if (!$imageBinary) {
                    $this->warn("- {$product->slug}: telechargement image impossible {$imageUrl}");
                    $failed++;
                    continue;
                }

                $relativePath = "images/geovision/products/{$product->slug}.webp";
                $absolutePath = public_path($relativePath);

                if (!$dryRun) {
                    $this->writeWebp($imageBinary, $absolutePath);
                    $this->replaceProductImage($product, "/{$relativePath}");
                    $this->saveSourceUrlIfMissing($product, $sourceUrl);
                }

                $this->info("- {$product->slug}: OK -> /{$relativePath}");
                $updated++;
            } catch (\Throwable $exception) {
                $this->error("- {$product->slug}: echec ({$exception->getMessage()})");
                $failed++;
            }
        }

        $this->newLine();
        $this->info("Termine. Mis a jour: {$updated}, ignores: {$skipped}, echecs: {$failed}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * @return array<int>
     */
    private function collectCategoryIds(CategorieProduit $root): array
    {
        $root->loadMissing('childrenRecursive');
        $ids = [$root->id_categorie];

        foreach ($root->childrenRecursive as $child) {
            $ids[] = $child->id_categorie;
        }

        return array_values(array_unique($ids));
    }

    private function guessSourceUrl(Produit $product): ?string
    {
        $candidate = trim((string) ($product->reference ?: $product->modele ?: $product->titre));

        if ($candidate === '') {
            return null;
        }

        $candidate = preg_replace('/\s+/', '', $candidate) ?: $candidate;
        return "https://www.geovision.com.tw/us/product/{$candidate}";
    }

    private function extractProductImageUrl(string $sourceUrl): ?string
    {
        $response = Http::withHeaders([
            'User-Agent' => 'Mozilla/5.0 (compatible; ISD-AFRIK-GeovisionImageSync/1.0)',
            'Accept' => 'text/html,application/xhtml+xml',
        ])->timeout(45)->get($sourceUrl);

        if (!$response->successful()) {
            return null;
        }

        $html = $response->body();

        libxml_use_internal_errors(true);
        $doc = new \DOMDocument();
        $doc->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
        $xpath = new \DOMXPath($doc);

        $candidates = [
            trim((string) $xpath->evaluate('string(//meta[@property="og:image"]/@content)')),
            trim((string) $xpath->evaluate('string(//meta[@name="twitter:image"]/@content)')),
            trim((string) $xpath->evaluate('string((//div[contains(@class,"product") or contains(@class,"prod") or contains(@class,"detail")]//img)[1]/@src)')),
            trim((string) $xpath->evaluate('string((//img[contains(@src,"product") or contains(@src,"Product")])[1]/@src)')),
            trim((string) $xpath->evaluate('string((//img)[1]/@src)')),
        ];

        foreach ($candidates as $candidate) {
            if (!$candidate) {
                continue;
            }

            $normalized = $this->absoluteUrl($candidate, $sourceUrl);

            if ($normalized && preg_match('/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i', $normalized)) {
                return $normalized;
            }
        }

        return null;
    }

    private function absoluteUrl(string $url, string $base): ?string
    {
        $url = trim($url);

        if ($url === '') {
            return null;
        }

        if (Str::startsWith($url, ['http://', 'https://'])) {
            return $url;
        }

        if (Str::startsWith($url, '//')) {
            return 'https:' . $url;
        }

        $parsed = parse_url($base);

        if (!$parsed || empty($parsed['scheme']) || empty($parsed['host'])) {
            return null;
        }

        $origin = $parsed['scheme'] . '://' . $parsed['host'];

        if (Str::startsWith($url, '/')) {
            return $origin . $url;
        }

        $path = $parsed['path'] ?? '/';
        $dir = rtrim(str_replace('\\', '/', dirname($path)), '/');
        return $origin . ($dir ? $dir . '/' : '/') . ltrim($url, '/');
    }

    private function downloadImage(string $imageUrl): ?string
    {
        $response = Http::withHeaders([
            'User-Agent' => 'Mozilla/5.0 (compatible; ISD-AFRIK-GeovisionImageSync/1.0)',
            'Accept' => 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        ])->timeout(60)->get($imageUrl);

        if (!$response->successful()) {
            return null;
        }

        return $response->body();
    }

    private function writeWebp(string $binary, string $absolutePath): void
    {
        $directory = dirname($absolutePath);

        if (!is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        $isAlreadyWebp = strlen($binary) > 12
            && substr($binary, 0, 4) === 'RIFF'
            && substr($binary, 8, 4) === 'WEBP';

        if ($isAlreadyWebp) {
            file_put_contents($absolutePath, $binary);
            return;
        }

        if (function_exists('imagecreatefromstring') && function_exists('imagewebp')) {
            $resource = @imagecreatefromstring($binary);

            if ($resource) {
                imagepalettetotruecolor($resource);

                if (!@imagewebp($resource, $absolutePath, 90)) {
                    imagedestroy($resource);
                    throw new \RuntimeException('Conversion webp echouee (GD).');
                }

                imagedestroy($resource);
                return;
            }
        }

        $convertBinary = trim((string) @shell_exec('command -v convert 2>/dev/null'));

        if ($convertBinary !== '') {
            $tmpInput = tempnam(sys_get_temp_dir(), 'gv-img-');
            $tmpOutput = tempnam(sys_get_temp_dir(), 'gv-webp-') . '.webp';

            if (!$tmpInput) {
                throw new \RuntimeException('Impossible de creer un fichier temporaire image.');
            }

            file_put_contents($tmpInput, $binary);

            $cmd = sprintf(
                '%s %s -quality 90 %s 2>&1',
                escapeshellarg($convertBinary),
                escapeshellarg($tmpInput),
                escapeshellarg($tmpOutput)
            );

            @shell_exec($cmd);

            if (!file_exists($tmpOutput) || filesize($tmpOutput) === 0) {
                @unlink($tmpInput);
                @unlink($tmpOutput);
                throw new \RuntimeException('Conversion webp echouee (ImageMagick).');
            }

            rename($tmpOutput, $absolutePath);
            @unlink($tmpInput);
            return;
        }

        throw new \RuntimeException('Aucun convertisseur webp disponible (GD/ImageMagick).');
    }

    private function replaceProductImage(Produit $product, string $url): void
    {
        $product->images()->delete();

        $product->images()->create([
            'url' => $url,
            'path' => ltrim($url, '/'),
            'alt' => $product->titre,
        ]);
    }

    private function saveSourceUrlIfMissing(Produit $product, string $sourceUrl): void
    {
        $specs = is_array($product->specifications) ? $product->specifications : [];

        if (!empty($specs['source_url'])) {
            return;
        }

        $specs['source_url'] = $sourceUrl;
        $product->specifications = $specs;
        $product->save();
    }
}
