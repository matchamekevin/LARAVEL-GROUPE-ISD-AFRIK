<?php

namespace App\Services;

use App\Models\CategorieProduit;
use App\Models\Pays;
use App\Models\Produit;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GeovisionCatalogSyncService
{
    private const BASE_URL = 'https://www.geovision.com.tw';

    /**
     * @return array{families:int,categories:int,products:int}
     */
    public function sync(bool $replace = true, bool $fetchDetails = true): array
    {
        $countryId = Pays::query()->value('id_pays');
        $userId = Utilisateur::query()->value('id_utilisateur');

        if (! $countryId || ! $userId) {
            throw new \RuntimeException('Synchronisation GeoVision impossible: pays ou utilisateur manquant.');
        }

        $snapshot = $this->buildSnapshot($fetchDetails);

        if (empty($snapshot['tree']) || empty($snapshot['products'])) {
            throw new \RuntimeException('Synchronisation GeoVision interrompue: aucune donnée officielle exploitable n’a été récupérée.');
        }

        if ($replace) {
            $this->clearExistingCatalog();
        }

        $categories = $this->syncCategoryTree($snapshot['tree']);

        $upsertData = [];
        $imageBatches = [];

        foreach ($snapshot['products'] as $product) {
            $category = $categories[$product['category_slug']] ?? null;

            if (! $category) {
                continue;
            }

            $definition = $product;
            $payload = [
                'titre' => $definition['title'],
                'slug' => $definition['slug'],
                'reference' => $definition['reference'],
                'description' => $definition['description'],
                'description_courte' => $definition['short_description'],
                'prix' => $definition['price'],
                'stock' => $definition['stock'],
                'stock_alerte' => $definition['stock_alert'],
                'statut' => $definition['status'],
                'marque' => $definition['brand'],
                'modele' => $definition['model'],
                'garantie' => $definition['warranty'],
                'est_en_vedette' => (bool) ($definition['featured'] ?? false),
                'est_nouveau' => (bool) ($definition['new'] ?? true),
                'en_promo' => false,
                'vues' => 0,
                'note_moyenne' => 0,
                'nombre_avis' => 0,
                'specifications' => json_encode([
                    'overview' => $definition['overview'],
                    'tags' => $definition['tags'] ?? [],
                    'features' => $definition['features'] ?? [],
                    'platforms' => $definition['platforms'] ?? [],
                    'use_cases' => $definition['use_cases'] ?? [],
                    'detail_notes' => $definition['detail_notes'] ?? [],
                    'source_url' => $definition['source_url'] ?? null,
                    'technical_specs' => $definition['technical_specs'] ?? [],
                    'taxonomy' => $definition['taxonomy'] ?? [],
                ]),
                'id_categorie' => $category->id_categorie,
                'id_pays' => $countryId,
                'id_utilisateur' => $userId,
                'date_creation' => now(),
            ];

            $upsertData[] = $payload;
            $imageBatches[$definition['slug']] = $definition['images'] ?? [];
        }

        if (! empty($upsertData)) {
            Produit::query()->upsert($upsertData, ['slug'], [
                'titre', 'reference', 'description', 'description_courte', 'prix',
                'stock', 'stock_alerte', 'statut', 'marque', 'modele', 'garantie',
                'est_en_vedette', 'est_nouveau', 'specifications',
                'id_categorie', 'id_pays', 'id_utilisateur', 'date_creation',
            ]);
        }

        foreach ($imageBatches as $slug => $images) {
            $product = Produit::query()->where('slug', $slug)->first();
            if ($product) {
                $this->syncImages($product, $images);
            }
        }

        return [
            'families' => count($snapshot['tree']),
            'categories' => count($categories) - count($snapshot['tree']),
            'products' => count($snapshot['products']),
        ];
    }

    /**
     * @return array{tree: array<int, array<string, mixed>>, products: array<int, array<string, mixed>>}
     */
    private function buildSnapshot(bool $fetchDetails): array
    {
        $tree = [];
        $products = [];

        foreach ($this->rootDefinitions() as $rootIndex => $root) {
            $html = $this->fetchPage($root['source']);

            if (! $html) {
                continue;
            }

            $sections = $this->parseListPage($html);

            if (empty($sections)) {
                continue;
            }

            $children = [];

            foreach ($sections as $sectionIndex => $section) {
                $categorySlug = sprintf('%s-%s', $root['slug'], Str::slug($section['name']));
                $children[] = [
                    'nom' => $section['name'],
                    'slug' => $categorySlug,
                    'description' => $this->buildCategoryDescription($root['nom'], $section['name']),
                    'image' => $section['image'] ?: $root['image'],
                    'ordre' => ($sectionIndex + 1) * 10,
                ];

                foreach ($section['products'] as $cardIndex => $card) {
                    $detail = $fetchDetails ? $this->parseProductDetail($card['detail_url']) : [];
                    $definition = $this->buildProductDefinition($root, $section['name'], $categorySlug, $card, $detail, $cardIndex);

                    if ($definition) {
                        $products[] = $definition;
                    }
                }
            }

            $tree[] = [
                'nom' => $root['nom'],
                'slug' => $root['slug'],
                'description' => $root['description'],
                'image' => $root['image'],
                'ordre' => ($rootIndex + 1) * 10,
                'children' => $children,
            ];
        }

        return [
            'tree' => $tree,
            'products' => $products,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function rootDefinitions(): array
    {
        return [
            [
                'nom' => 'Caméras',
                'slug' => 'geovision-cameras',
                'description' => 'Catalogue officiel GeoVision des caméras IP, intelligentes, thermiques et spécialisées.',
                'image' => '/images/geovision/cam/cam1.webp',
                'source' => self::BASE_URL.'/us/products.php?c1=3',
            ],
            [
                'nom' => 'Contrôle d’accès',
                'slug' => 'geovision-controle-acces',
                'description' => 'Contrôleurs, lecteurs, logiciels et accessoires officiels GeoVision pour la gestion des accès.',
                'image' => '/images/geovision/controleur1.webp',
                'source' => self::BASE_URL.'/us/products.php?c1=25',
            ],
            [
                'nom' => 'LPR / ANPR',
                'slug' => 'geovision-lpr-anpr',
                'description' => 'Solutions GeoVision de lecture de plaques, caméras dédiées et logiciels associés.',
                'image' => '/images/geovision/cam/cam3.webp',
                'source' => self::BASE_URL.'/us/products.php?c1=7',
            ],
            [
                'nom' => 'VMS & Analytics',
                'slug' => 'geovision-vms-analytics',
                'description' => 'Suite officielle GeoVision pour supervision vidéo, analytique, intégration, sauvegarde et mobile.',
                'image' => '/images/geovision/solution1.webp',
                'source' => self::BASE_URL.'/us/products.php?c1=14',
            ],
            [
                'nom' => 'Systèmes de surveillance',
                'slug' => 'geovision-systemes-surveillance',
                'description' => 'Stations, appliances et systèmes GeoVision pour déploiements VMS, NVR, IA, stockage et mobilité.',
                'image' => '/images/geovision/solution1.webp',
                'source' => self::BASE_URL.'/us/products.php?c1=4',
            ],
            [
                'nom' => 'Enregistreurs & décodage',
                'slug' => 'geovision-enregistreurs-nvr',
                'description' => 'Standalone, SNVR, DVR, décodeurs et encodeurs GeoVision pour l’enregistrement et l’affichage.',
                'image' => '/images/geovision/nvr/nvr1.webp',
                'source' => self::BASE_URL.'/us/products.php?c1=158',
            ],
            [
                'nom' => 'PoE & Réseau',
                'slug' => 'geovision-poe-reseau',
                'description' => 'Switches, injecteurs, adaptateurs, extenders et accessoires réseau officiels GeoVision.',
                'image' => '/images/geovision/solution1.webp',
                'source' => self::BASE_URL.'/us/products.php?c1=39',
            ],
            [
                'nom' => 'IP Speaker & IO Box',
                'slug' => 'geovision-ip-speaker-io',
                'description' => 'Haut-parleurs IP, cartes réseau, IO box et relais GeoVision pour scénarios audio et automatisation.',
                'image' => '/images/geovision/solution1.webp',
                'source' => self::BASE_URL.'/us/products.php?c1=31',
            ],
        ];
    }

    private function buildCategoryDescription(string $familyName, string $categoryName): string
    {
        return sprintf('Catalogue officiel GeoVision pour %s dans la famille %s.', $categoryName, $familyName);
    }

    /**
     * @return array<int, array{name:string,image:string,products:array<int, array<string, mixed>>}>
     */
    private function parseListPage(string $html): array
    {
        $xpath = $this->makeXPath($html);
        $sections = [];

        foreach ($xpath->query('//div[@id="productList"]/div[contains(@class,"linkWrapper")]') as $sectionNode) {
            $name = $this->normalizeWhitespace($xpath->evaluate('string(.//h2[contains(@class,"softType")][1])', $sectionNode));

            if ($name === '') {
                continue;
            }

            $products = [];
            $categoryImage = '';

            foreach ($xpath->query('.//a[contains(@href,"/product/")]', $sectionNode) as $anchorNode) {
                $product = $this->parseListingCard($xpath, $anchorNode);

                if (! $product) {
                    continue;
                }

                if ($categoryImage === '' && ! empty($product['image'])) {
                    $categoryImage = $product['image'];
                }

                $products[] = $product;
            }

            if (! empty($products)) {
                $sections[] = [
                    'name' => $name,
                    'image' => $categoryImage,
                    'products' => $products,
                ];
            }
        }

        return $sections;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function parseListingCard(\DOMXPath $xpath, \DOMNode $anchorNode): ?array
    {
        $title = $this->normalizeWhitespace(
            $anchorNode->attributes?->getNamedItem('title')?->nodeValue
                ?: $xpath->evaluate('string(.//h3[1])', $anchorNode)
        );

        $href = $anchorNode->attributes?->getNamedItem('href')?->nodeValue ?? '';

        if ($title === '' || $href === '') {
            return null;
        }

        $image = $this->absoluteUrl(
            $xpath->evaluate('string(.//img[1]/@src)', $anchorNode)
        );

        $summaryLines = [];
        $summaryNode = $xpath->query('.//p[1]', $anchorNode)->item(0);

        if ($summaryNode) {
            $summaryHtml = $anchorNode->ownerDocument?->saveHTML($summaryNode) ?: '';
            $summaryHtml = preg_replace('#^<p[^>]*>|</p>$#i', '', $summaryHtml);
            $summaryLines = array_values(array_filter(array_map(
                fn ($line) => $this->normalizeWhitespace(strip_tags($line)),
                preg_split('/<br\s*\/?>/i', (string) $summaryHtml) ?: []
            )));
        }

        $tags = [];
        foreach ($xpath->query('.//ul[contains(@class,"tagList")]//span', $anchorNode) as $tagNode) {
            $tag = $this->normalizeWhitespace($tagNode->textContent);
            if ($tag !== '') {
                $tags[] = $tag;
            }
        }

        return [
            'title' => $title,
            'reference' => $title,
            'detail_url' => $this->absoluteUrl($href),
            'image' => $image,
            'summary_lines' => $summaryLines,
            'tags' => array_values(array_unique($tags)),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function parseProductDetail(string $url): array
    {
        $html = $this->fetchPage($url);

        if (! $html) {
            return [];
        }

        $xpath = $this->makeXPath($html);
        $title = $this->normalizeWhitespace($xpath->evaluate('string(//div[contains(@class,"textWrapper")]//h1[1])'));
        $intro = $this->normalizeWhitespace($xpath->evaluate('string(//p[contains(@class,"intro")][1])'));
        $descriptionNode = $xpath->query('(//div[contains(@class,"textWrapper")]//div[contains(@class,"html")])[1]')->item(0);
        $overview = $this->nodeToText($descriptionNode);

        $technicalSpecs = [];
        foreach ($xpath->query('//table[@id="table1"]/tr') as $rowNode) {
            $cells = $xpath->query('./td', $rowNode);
            if ($cells->length < 2) {
                continue;
            }

            $label = $this->normalizeWhitespace($cells->item(0)?->textContent ?? '');
            $value = $this->normalizeWhitespace($cells->item(1)?->textContent ?? '');

            if ($label !== '' || $value !== '') {
                $technicalSpecs[] = [
                    'label' => $label,
                    'value' => $value,
                ];
            }
        }

        $features = [];
        foreach ($xpath->query('//div[@id="tab-1"]//ul[contains(@class,"rows")][1]/li') as $featureNode) {
            $feature = $this->normalizeWhitespace($featureNode->textContent);
            if ($feature !== '') {
                $features[] = $feature;
            }
        }

        return array_filter([
            'title' => $title,
            'intro' => $intro,
            'overview' => $overview,
            'image' => $this->absoluteUrl($xpath->evaluate('string(//div[@id="maximage"]//img[1]/@src)')),
            'features' => array_values(array_unique($features)),
            'technical_specs' => $technicalSpecs,
            'source_url' => $url,
        ], function ($value) {
            if (is_array($value)) {
                return ! empty($value);
            }

            return filled($value);
        });
    }

    /**
     * @param  array<string, mixed>  $root
     * @param  array<string, mixed>  $card
     * @param  array<string, mixed>  $detail
     * @return array<string, mixed>|null
     */
    private function buildProductDefinition(
        array $root,
        string $categoryName,
        string $categorySlug,
        array $card,
        array $detail,
        int $cardIndex
    ): ?array {
        $title = $detail['title'] ?? $card['title'] ?? '';

        if ($title === '') {
            return null;
        }

        $summaryLines = $card['summary_lines'] ?? [];
        $overview = $detail['overview'] ?? '';
        $intro = $detail['intro'] ?? '';
        $tags = array_values(array_unique($card['tags'] ?? []));
        $tagSummary = implode(' · ', array_slice($tags, 0, 6));
        $description = $overview ?: $intro ?: implode(' · ', $summaryLines) ?: $tagSummary;
        $shortDescription = $intro ?: implode(' · ', $summaryLines) ?: $tagSummary ?: Str::limit($description, 180);
        $features = array_values(array_unique($detail['features'] ?? []));
        $technicalSpecs = $detail['technical_specs'] ?? [];
        $images = array_values(array_unique(array_filter([
            $detail['image'] ?? null,
            $card['image'] ?? null,
        ])));
        $reference = $card['reference'] ?? $title;

        return [
            'title' => $title,
            'slug' => 'geovision-'.Str::slug($title),
            'reference' => $reference,
            'model' => $title,
            'category_slug' => $categorySlug,
            'description' => $description,
            'short_description' => $shortDescription,
            'price' => 0,
            'stock' => 999,
            'stock_alert' => 5,
            'status' => 'actif',
            'brand' => 'GeoVision',
            'warranty' => 'Garantie constructeur',
            'featured' => $root['slug'] === 'geovision-cameras' && $cardIndex < 4,
            'new' => true,
            'overview' => $description,
            'features' => $features,
            'use_cases' => $summaryLines,
            'detail_notes' => array_values(array_filter([$overview, $intro])),
            'technical_specs' => $technicalSpecs,
            'images' => $images,
            'taxonomy' => [
                'family' => $root['nom'],
                'category' => $categoryName,
                'subcategory' => $categoryName,
                'series' => $this->inferSeries($title),
            ],
            'tags' => $tags,
            'platforms' => $summaryLines,
            'source_url' => $detail['source_url'] ?? $card['detail_url'],
        ];
    }

    private function inferSeries(string $title): string
    {
        if (preg_match('/^(GV-[A-Z0-9-]+|UVS-[A-Z0-9-]+)/i', $title, $matches)) {
            return $matches[1];
        }

        return $title;
    }

    private function fetchPage(string $url): ?string
    {
        $response = Http::withHeaders([
            'User-Agent' => 'Mozilla/5.0 (compatible; ISD-AFRIK-GeovisionSync/1.0)',
            'Accept' => 'text/html,application/xhtml+xml',
        ])
            ->retry(2, 500)
            ->timeout(45)
            ->get(str_replace(' ', '%20', $url));

        if (! $response->successful()) {
            return null;
        }

        return $response->body();
    }

    private function makeXPath(string $html): \DOMXPath
    {
        libxml_use_internal_errors(true);

        $document = new \DOMDocument;
        $document->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));

        return new \DOMXPath($document);
    }

    private function nodeToText(?\DOMNode $node): string
    {
        if (! $node) {
            return '';
        }

        return $this->normalizeWhitespace(strip_tags($node->ownerDocument?->saveHTML($node) ?: ''));
    }

    private function normalizeWhitespace(?string $value): string
    {
        return trim((string) preg_replace('/\s+/u', ' ', (string) $value));
    }

    private function absoluteUrl(?string $path): string
    {
        $candidate = trim((string) $path);

        if ($candidate === '') {
            return '';
        }

        if (Str::startsWith($candidate, ['http://', 'https://'])) {
            return $candidate;
        }

        $candidate = preg_replace('#^/\.\./#', '/', $candidate) ?? $candidate;

        return rtrim(self::BASE_URL, '/').'/'.ltrim($candidate, '/');
    }

    private function clearExistingCatalog(): void
    {
        $productIds = Produit::withTrashed()
            ->whereHas('categorie', fn ($query) => $query->where('segment', 'geovision'))
            ->pluck('id_produit');

        if ($productIds->isNotEmpty()) {
            \App\Models\Image::query()
                ->where('imageable_type', 'PRODUIT')
                ->whereIn('imageable_id', $productIds)
                ->forceDelete();

            \App\Models\LignesCommande::query()
                ->whereIn('id_produit', $productIds)
                ->forceDelete();

            \App\Models\Commentaire::query()
                ->where('commentable_type', 'PRODUIT')
                ->whereIn('commentable_id', $productIds)
                ->forceDelete();

            Produit::withTrashed()
                ->whereIn('id_produit', $productIds)
                ->forceDelete();
        }

        while (CategorieProduit::query()->where('segment', 'geovision')->exists()) {
            $deleted = CategorieProduit::query()
                ->where('segment', 'geovision')
                ->whereDoesntHave('children')
                ->delete();

            if ($deleted === 0) {
                break;
            }
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $tree
     * @return array<string, CategorieProduit>
     */
    private function syncCategoryTree(array $tree, ?CategorieProduit $parent = null): array
    {
        $categories = [];

        foreach ($tree as $index => $node) {
            $payload = [
                'nom' => $node['nom'],
                'slug' => $node['slug'],
                'description' => $node['description'] ?? null,
                'segment' => 'geovision',
                'image' => $node['image'] ?? null,
                'image_url' => $node['image'] ?? null,
                'parent_id' => $parent?->id_categorie,
                'ordre' => $node['ordre'] ?? (($index + 1) * 10),
                'actif' => true,
            ];

            $category = CategorieProduit::query()->updateOrCreate(
                ['slug' => $node['slug']],
                $payload
            );

            $categories[$node['slug']] = $category;

            if (! empty($node['children']) && is_array($node['children'])) {
                $categories = array_merge(
                    $categories,
                    $this->syncCategoryTree($node['children'], $category)
                );
            }
        }

        return $categories;
    }

    /**
     * @param  array<int, string>  $images
     */
    private function syncImages(Produit $product, array $images): void
    {
        $product->images()->delete();

        $insertData = collect($images)
            ->filter(fn ($image) => filled($image))
            ->map(fn ($image) => trim((string) $image))
            ->unique()
            ->values()
            ->map(fn (string $image, int $index) => [
                'url' => $image,
                'path' => ltrim($image, '/'),
                'alt' => sprintf('%s - visuel %d', $product->titre, $index + 1),
                'imageable_type' => 'PRODUIT',
                'imageable_id' => $product->id_produit,
                'created_at' => now(),
                'updated_at' => now(),
            ])
            ->all();

        if (! empty($insertData)) {
            \App\Models\Image::query()->insert($insertData);
        }
    }
}
