<?php

/**
 * Télécharge les vraies images de produits depuis des sources fiables (Amazon, fabricants)
 * Usage: php download_real_product_images.php
 */

// Configuration
$imgDir = '/home/kev/Bureau/LARAVEL-GROUPE-ISD-AFRIK/storage/app/public/produits';
$dbConn = [
    'host' => '127.0.0.1',
    'port' => '5432',
    'dbname' => 'isd_group_afrik',
    'user' => 'root',
    'password' => 'root',
];

if (! is_dir($imgDir)) {
    mkdir($imgDir, 0755, true);
}

// Connexion DB via PDO (PostgreSQL)
try {
    $pdo = new PDO("pgsql:host={$dbConn['host']};port={$dbConn['port']};dbname={$dbConn['dbname']}", $dbConn['user'], $dbConn['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    exit('DB connection failed: '.$e->getMessage()."\n");
}

// Récupérer tous les produits SANS image (ceux qu'on a créés)
$sql = "SELECT p.id_produit, p.titre, p.marque, p.modele, cp.slug AS cat_slug, cp.nom AS cat_nom
        FROM produits p
        JOIN categories_produits cp ON cp.id_categorie = p.id_categorie
        WHERE p.id_produit NOT IN (
            SELECT imageable_id FROM images WHERE imageable_type = 'PRODUIT'
        )
        AND cp.segment = 'general'
        ORDER BY cp.nom, p.titre";

$products = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

if (empty($products)) {
    echo "Aucun produit sans image trouvé.\n";
    // Vérifions s'il y en a avec des images picsum
    $sql2 = "SELECT COUNT(*) FROM images WHERE imageable_type = 'PRODUIT' AND url LIKE '%storage/produits/prod_%'";
    $c = $pdo->query($sql2)->fetchColumn();
    echo "Images prod_* restantes: {$c}\n";
    exit;
}

echo 'Produits sans image: '.count($products)."\n";

$downloaded = 0;
$failed = 0;

foreach ($products as $prod) {
    $query = "{$prod['marque']} {$prod['modele']} product";
    echo "  [{$prod['cat_nom']}] {$prod['titre']} ({$prod['marque']} {$prod['modele']})... ";

    $imageUrl = findProductImage($query);

    if ($imageUrl) {
        $localName = "prod_{$prod['id_produit']}_".substr(bin2hex(random_bytes(4)), 0, 8).'.webp';
        $localPath = "produits/{$localName}";
        $fullPath = "{$imgDir}/{$localName}";

        if (downloadImage($imageUrl, $fullPath)) {
            $size = filesize($fullPath);
            if ($size > 500) {
                // Insérer l'enregistrement image
                $stmt = $pdo->prepare("INSERT INTO images (id_image, url, path, alt, imageable_type, imageable_id, created_at, updated_at)
                    VALUES (gen_random_uuid(), :url, :path, :alt, 'PRODUIT', :pid, NOW(), NOW())");
                $stmt->execute([
                    ':url' => "/storage/{$localPath}",
                    ':path' => "{$localPath}",
                    ':alt' => "{$prod['marque']} {$prod['modele']} - {$prod['titre']}",
                    ':pid' => $prod['id_produit'],
                ]);
                echo "OK ({$size} bytes)\n";
                $downloaded++;

                continue;
            }
            unlink($fullPath);
        }
    }

    // Fallback: chercher sur Amazon
    $amazonUrl = searchAmazonImage($query);
    if ($amazonUrl) {
        $localName = "prod_{$prod['id_produit']}_".substr(bin2hex(random_bytes(4)), 0, 8).'.webp';
        $localPath = "produits/{$localName}";
        $fullPath = "{$imgDir}/{$localName}";

        if (downloadImage($amazonUrl, $fullPath)) {
            $size = filesize($fullPath);
            if ($size > 500) {
                $stmt = $pdo->prepare("INSERT INTO images (id_image, url, path, alt, imageable_type, imageable_id, created_at, updated_at)
                    VALUES (gen_random_uuid(), :url, :path, :alt, 'PRODUIT', :pid, NOW(), NOW())");
                $stmt->execute([
                    ':url' => "/storage/{$localPath}",
                    ':path' => "{$localPath}",
                    ':alt' => "{$prod['marque']} {$prod['modele']} - {$prod['titre']}",
                    ':pid' => $prod['id_produit'],
                ]);
                echo "OK (Amazon, {$size} bytes)\n";
                $downloaded++;

                continue;
            }
            unlink($fullPath);
        }
    }

    echo "FAILED\n";
    $failed++;
}

echo "\nRésumé: {$downloaded} téléchargées, {$failed} échouées\n";

// ============== FONCTIONS ==============

function findProductImage(string $query): ?string
{
    // Stratégie 1: DuckDuckGo Image Search
    $url = getDuckDuckGoImage($query);
    if ($url) {
        return $url;
    }

    // Stratégie 2: Tentative directe fabricant
    $url = guessManufacturerImageUrl($query);
    if ($url) {
        return $url;
    }

    return null;
}

function getDuckDuckGoImage(string $query): ?string
{
    try {
        // D'abord obtenir un token vqd
        $html = @file_get_contents('https://duckduckgo.com/?q='.urlencode($query), false, stream_context_create([
            'http' => [
                'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n",
                'timeout' => 10,
            ],
        ]));
        if (! $html) {
            return null;
        }

        // Extraire le token vqd
        if (! preg_match('/vqd=([^"&]+)/', $html, $m)) {
            return null;
        }
        $vqd = $m[1];

        // Appel API images DuckDuckGo
        $url = 'https://duckduckgo.com/i.js?q='.urlencode($query)."&o=json&vqd={$vqd}&p=1&f=,,,";
        $json = @file_get_contents($url, false, stream_context_create([
            'http' => [
                'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\nReferer: https://duckduckgo.com/\r\n",
                'timeout' => 10,
            ],
        ]));
        if (! $json) {
            return null;
        }

        $data = json_decode($json, true);
        if (! empty($data['results'][0]['image'])) {
            return $data['results'][0]['image'];
        }
    } catch (\Exception $e) {
        // ignore
    }

    return null;
}

function searchAmazonImage(string $query): ?string
{
    try {
        $url = 'https://www.amazon.com/s?k='.urlencode($query);
        $html = @file_get_contents($url, false, stream_context_create([
            'http' => [
                'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\nAccept: text/html,application/xhtml+xml\r\nAccept-Language: en-US,en;q=0.9\r\n",
                'timeout' => 10,
            ],
        ]));
        if (! $html) {
            return null;
        }

        // Amazon utilise des images avec data-a-dynamic-image ou src
        // Chercher d'abord les images dans les résultats de recherche
        if (preg_match('/<img[^>]+src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"[^>]*>/', $html, $m)) {
            $imgUrl = $m[1];
            // Nettoyer les paramètres de dimension
            $imgUrl = preg_replace('/\._(AC|SY|UX|SX)\d+[^".]*\.jpg/', '.jpg', $imgUrl);
            $imgUrl = preg_replace('/\._(AC|SY|UX|SX)\d+[^".]*\.jpg/', '.jpg', $imgUrl);

            return $imgUrl;
        }

        // Alternative: chercher le pattern data-a-dynamic-image
        if (preg_match('/data-a-dynamic-image=\'([^\']+)\'/', $html, $m)) {
            $dynamicData = json_decode(str_replace('&quot;', '"', $m[1]), true);
            if (is_array($dynamicData) && ! empty($dynamicData)) {
                return array_key_first($dynamicData);
            }
        }
    } catch (\Exception $e) {
        // ignore
    }

    return null;
}

function guessManufacturerImageUrl(string $query): ?string
{
    // Tentatives pour les URLs connues de fabricants
    $guessPatterns = [
        // DJI
        '/dji/i' => function ($q) {
            $parts = explode(' ', $q);
            foreach ($parts as $p) {
                if (preg_match('/[A-Z]/', $p) || preg_match('/mini|mavic|air|matrice|agras/i', $p)) {
                    $slug = strtolower(str_replace(' ', '-', trim($p)));

                    return "https://www.dji.com/static/{$slug}/product/{$slug}.png";
                }
            }

            return null;
        },
    ];

    foreach ($guessPatterns as $pattern => $generator) {
        if (preg_match($pattern, $query)) {
            $url = $generator($query);
            if ($url) {
                $headers = @get_headers($url);
                if ($headers && strpos($headers[0], '200') !== false) {
                    return $url;
                }
            }
        }
    }

    return null;
}

function downloadImage(string $url, string $dest): bool
{
    $ctx = stream_context_create([
        'http' => [
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n",
            'timeout' => 15,
            'follow_location' => 1,
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ],
    ]);

    $data = @file_get_contents($url, false, $ctx);
    if ($data === false || strlen($data) < 500) {
        return false;
    }

    // Convertir en webp si c'est un jpg/png
    file_put_contents($dest, $data);

    return true;
}
