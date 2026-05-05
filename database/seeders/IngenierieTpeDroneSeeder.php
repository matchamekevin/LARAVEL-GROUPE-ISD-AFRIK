<?php

namespace Database\Seeders;

use App\Models\CategorieProduit;
use App\Models\Pays;
use App\Models\Produit;
use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class IngenierieTpeDroneSeeder extends Seeder
{
    public function run(): void
    {
        $countryId = Pays::query()->value('id_pays');
        $userId = Utilisateur::query()->value('id_utilisateur');

        if (!$countryId) {
            $this->command?->warn('Seeder ignore: pays introuvable.');
            return;
        }

        $engineering = CategorieProduit::query()->where('slug', 'ingenierie')->first();
        if (!$engineering) {
            $this->command?->warn('Seeder ignore: categorie ingenierie introuvable.');
            return;
        }

        $categories = CategorieProduit::query()
            ->whereIn('slug', ['tpe', 'drone'])
            ->where('parent_id', $engineering->id_categorie)
            ->get(['id_categorie', 'slug', 'nom'])
            ->keyBy('slug');

        if ($categories->isEmpty()) {
            $this->command?->warn('Sous-categories tpe/drone introuvables sous ingenierie, fallback sur slug.');
            $categories = CategorieProduit::query()
                ->whereIn('slug', ['tpe', 'drone'])
                ->get(['id_categorie', 'slug', 'nom'])
                ->keyBy('slug');
        }

        if ($categories->isEmpty()) {
            $this->command?->warn('Seeder ignore: sous-categories tpe/drone introuvables.');
            return;
        }

        $categoryIds = $categories->pluck('id_categorie')->values()->all();

        DB::transaction(function () use ($categories, $categoryIds, $countryId, $userId) {
            $existing = Produit::withTrashed()
                ->whereIn('id_categorie', $categoryIds)
                ->get();

            foreach ($existing as $product) {
                $product->forceDelete();
            }

            $domainName = 'Catalogue Produits Techniques';
            $categoryName = 'Ingenierie';

            foreach ($this->catalogDefinition() as $slug => $items) {
                $category = $categories->get($slug);
                if (!$category) {
                    continue;
                }

                foreach ($items as $item) {
                    $title = $item['title'];
                    $payload = [
                        'uuid' => (string) Str::uuid(),
                        'titre' => $title,
                        'slug' => Str::slug($title),
                        'reference' => $item['reference'],
                        'description' => $item['description'],
                        'description_courte' => $item['short_description'],
                        'prix' => $item['price'],
                        'prix_promo' => $item['promo_price'],
                        'stock' => $item['stock'],
                        'stock_alerte' => $item['stock_alert'],
                        'statut' => $item['status'],
                        'marque' => $item['brand'],
                        'modele' => $item['model'],
                        'poids' => $item['weight'],
                        'specifications' => $this->buildSpecifications($item, $domainName, $categoryName, $category->nom),
                        'garantie' => $item['warranty'],
                        'est_en_vedette' => (bool) $item['featured'],
                        'est_nouveau' => (bool) $item['is_new'],
                        'en_promo' => (bool) $item['is_promo'],
                        'vues' => 0,
                        'note_moyenne' => 0,
                        'nombre_avis' => 0,
                        'id_categorie' => $category->id_categorie,
                        'id_pays' => $countryId,
                        'id_utilisateur' => $userId,
                        'date_creation' => now(),
                    ];

                    if (!Schema::hasColumn('produits', 'en_promo')) {
                        unset($payload['en_promo']);
                    }

                    if (Schema::hasColumn('produits', 'segment')) {
                        $payload['segment'] = 'general';
                    }

                    $product = Produit::query()->create($payload);

                    $this->syncImages($product->id_produit, $title, $item['images']);
                }
            }
        });
    }

    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    private function catalogDefinition(): array
    {
        return [
            'tpe' => [
                [
                    'title' => 'TPE Ingenico Move/5000',
                    'reference' => 'TPE-ING-MOVE5000-001',
                    'brand' => 'Ingenico',
                    'model' => 'Move/5000',
                    'price' => 325000,
                    'promo_price' => 299000,
                    'stock' => 15,
                    'stock_alert' => 3,
                    'status' => 'actif',
                    'warranty' => '12 mois',
                    'weight' => 0.45,
                    'short_description' => 'Terminal de paiement mobile 4G et sans contact.',
                    'description' => 'Terminal compact pour paiements carte, NFC et QR dans les commerces mobiles.',
                    'overview' => 'Ideal pour boutiques, livreurs et services terrain.',
                    'tags' => ['tpe', 'ingenico', 'paiement', 'nfc', 'mobile'],
                    'features' => [
                        'Ecran tactile couleur',
                        'NFC et paiement sans contact',
                        'Connexion 4G/Wi-Fi/Bluetooth',
                        'Impression thermique integree',
                    ],
                    'technical_specs' => [
                        ['label' => 'Ecran', 'value' => '3.5 pouces'],
                        ['label' => 'Connectivite', 'value' => '4G / Wi-Fi / Bluetooth'],
                        ['label' => 'Batterie', 'value' => '2500 mAh'],
                        ['label' => 'Poids', 'value' => '450 g'],
                    ],
                    'platforms' => ['Android'],
                    'use_cases' => ['Commerce', 'Restaurant', 'Livraison'],
                    'images' => ['/images/default.webp'],
                    'featured' => true,
                    'is_new' => true,
                    'is_promo' => true,
                ],
                [
                    'title' => 'TPE Verifone VX680',
                    'reference' => 'TPE-VER-VX680-002',
                    'brand' => 'Verifone',
                    'model' => 'VX680',
                    'price' => 295000,
                    'promo_price' => 279000,
                    'stock' => 12,
                    'stock_alert' => 3,
                    'status' => 'actif',
                    'warranty' => '12 mois',
                    'weight' => 0.42,
                    'short_description' => 'TPE robuste avec imprimante integree et autonomie longue.',
                    'description' => 'Terminal portable concu pour les points de vente mobiles et les paiements securises.',
                    'overview' => 'Ideal pour marches, taxis et ventes itinerantes.',
                    'tags' => ['tpe', 'verifone', 'paiement', 'portable'],
                    'features' => [
                        'Imprimante thermique integree',
                        'Support EMV, NFC et bande magnetique',
                        'Connexion GSM/GPRS',
                        'Batterie longue duree',
                    ],
                    'technical_specs' => [
                        ['label' => 'Ecran', 'value' => '2.8 pouces'],
                        ['label' => 'Connectivite', 'value' => 'GSM / GPRS'],
                        ['label' => 'Batterie', 'value' => '2200 mAh'],
                        ['label' => 'Poids', 'value' => '420 g'],
                    ],
                    'platforms' => ['Proprietaire'],
                    'use_cases' => ['Retail', 'Transport', 'Services'],
                    'images' => ['/images/default.webp'],
                    'featured' => false,
                    'is_new' => true,
                    'is_promo' => true,
                ],
                [
                    'title' => 'TPE PAX A920',
                    'reference' => 'TPE-PAX-A920-003',
                    'brand' => 'PAX',
                    'model' => 'A920',
                    'price' => 310000,
                    'promo_price' => null,
                    'stock' => 18,
                    'stock_alert' => 4,
                    'status' => 'actif',
                    'warranty' => '12 mois',
                    'weight' => 0.55,
                    'short_description' => 'TPE Android tout-en-un avec ecran tactile 5 pouces.',
                    'description' => 'Terminal intelligent compatible apps metier et paiements rapides.',
                    'overview' => 'Ideal pour boutiques modernes et services digitaux.',
                    'tags' => ['tpe', 'pax', 'android', 'contactless'],
                    'features' => [
                        'Ecran tactile 5 pouces',
                        'Android avec apps metier',
                        '4G/Wi-Fi/Bluetooth',
                        'Camere integree pour QR',
                    ],
                    'technical_specs' => [
                        ['label' => 'Ecran', 'value' => '5 pouces'],
                        ['label' => 'Connectivite', 'value' => '4G / Wi-Fi / Bluetooth'],
                        ['label' => 'Batterie', 'value' => '5150 mAh'],
                        ['label' => 'Poids', 'value' => '550 g'],
                    ],
                    'platforms' => ['Android'],
                    'use_cases' => ['Retail', 'Restaurant', 'Service'],
                    'images' => ['/images/default.webp'],
                    'featured' => false,
                    'is_new' => true,
                    'is_promo' => false,
                ],
            ],
            'drone' => [
                [
                    'title' => 'Drone DJI Matrice 350 RTK',
                    'reference' => 'DRN-DJI-M350RTK-001',
                    'brand' => 'DJI',
                    'model' => 'Matrice 350 RTK',
                    'price' => 5800000,
                    'promo_price' => null,
                    'stock' => 4,
                    'stock_alert' => 1,
                    'status' => 'actif',
                    'warranty' => '12 mois',
                    'weight' => 3.8,
                    'short_description' => 'Drone industriel RTK pour missions critiques et cartographie.',
                    'description' => 'Plateforme robuste avec capteurs interchangeables et RTK haute precision.',
                    'overview' => 'Ideal pour inspection, topographie et securite.',
                    'tags' => ['drone', 'dji', 'rtk', 'inspection'],
                    'features' => [
                        'Precision RTK integree',
                        'Detection obstacles omnidirectionnelle',
                        'Resistance IP55',
                        'Compatibilite charges utiles',
                    ],
                    'technical_specs' => [
                        ['label' => 'Resolution', 'value' => '4K'],
                        ['label' => 'Autonomie', 'value' => '55 min'],
                        ['label' => 'Portee', 'value' => '20 km'],
                        ['label' => 'Poids', 'value' => '3.8 kg'],
                    ],
                    'platforms' => ['iOS', 'Android'],
                    'use_cases' => ['Cartographie', 'Inspection', 'Securite'],
                    'images' => ['/images/default.webp'],
                    'featured' => true,
                    'is_new' => true,
                    'is_promo' => false,
                ],
                [
                    'title' => 'Drone DJI Mavic 3 Enterprise',
                    'reference' => 'DRN-DJI-MAVIC3E-002',
                    'brand' => 'DJI',
                    'model' => 'Mavic 3 Enterprise',
                    'price' => 2800000,
                    'promo_price' => 2650000,
                    'stock' => 6,
                    'stock_alert' => 2,
                    'status' => 'actif',
                    'warranty' => '12 mois',
                    'weight' => 0.9,
                    'short_description' => 'Drone compact pour inspection rapide et cartographie.',
                    'description' => 'Capteur 4K et zoom pour missions d inspection et de securite.',
                    'overview' => 'Ideal pour batiments, infrastructures et surveillance.',
                    'tags' => ['drone', 'dji', 'enterprise', '4k'],
                    'features' => [
                        'Camera 4K avec zoom',
                        'Autonomie longue',
                        'Detection obstacles',
                        'Transmission longue portee',
                    ],
                    'technical_specs' => [
                        ['label' => 'Resolution', 'value' => '4K'],
                        ['label' => 'Autonomie', 'value' => '45 min'],
                        ['label' => 'Portee', 'value' => '15 km'],
                        ['label' => 'Poids', 'value' => '900 g'],
                    ],
                    'platforms' => ['iOS', 'Android'],
                    'use_cases' => ['Inspection', 'Surveillance', 'Cartographie'],
                    'images' => ['/images/default.webp'],
                    'featured' => false,
                    'is_new' => true,
                    'is_promo' => true,
                ],
                [
                    'title' => 'Drone Autel EVO II Pro',
                    'reference' => 'DRN-AUTEL-EVO2PRO-003',
                    'brand' => 'Autel',
                    'model' => 'EVO II Pro',
                    'price' => 2400000,
                    'promo_price' => null,
                    'stock' => 5,
                    'stock_alert' => 2,
                    'status' => 'actif',
                    'warranty' => '12 mois',
                    'weight' => 1.2,
                    'short_description' => 'Drone 6K pour production video et inspection.',
                    'description' => 'Capteur haute resolution avec autonomie longue et stabilisation avancee.',
                    'overview' => 'Ideal pour video pro et inspection de site.',
                    'tags' => ['drone', 'autel', '6k', 'camera'],
                    'features' => [
                        'Capteur 6K',
                        'Detection obstacles',
                        'Transmission 10 km',
                        'Mode nuit avance',
                    ],
                    'technical_specs' => [
                        ['label' => 'Resolution', 'value' => '6K'],
                        ['label' => 'Autonomie', 'value' => '40 min'],
                        ['label' => 'Portee', 'value' => '10 km'],
                        ['label' => 'Poids', 'value' => '1.2 kg'],
                    ],
                    'platforms' => ['iOS', 'Android'],
                    'use_cases' => ['Video', 'Inspection', 'Immobilier'],
                    'images' => ['/images/default.webp'],
                    'featured' => false,
                    'is_new' => true,
                    'is_promo' => false,
                ],
                [
                    'title' => 'Drone DJI Mini 4 Pro',
                    'reference' => 'DRN-DJI-MINI4PRO-004',
                    'brand' => 'DJI',
                    'model' => 'Mini 4 Pro',
                    'price' => 620000,
                    'promo_price' => 589000,
                    'stock' => 12,
                    'stock_alert' => 3,
                    'status' => 'actif',
                    'warranty' => '12 mois',
                    'weight' => 0.249,
                    'short_description' => 'Drone compact 4K intelligent ultra leger.',
                    'description' => 'Video 4K HDR, detection obstacles omnidirectionnelle et longue autonomie.',
                    'overview' => 'Ideal createurs de contenu et voyageurs.',
                    'tags' => ['drone', 'dji', '4k', 'camera', 'mini'],
                    'features' => [
                        'Camera 4K',
                        'GPS',
                        'Retour automatique',
                        'Obstacle sensing',
                    ],
                    'technical_specs' => [
                        ['label' => 'Resolution', 'value' => '4K'],
                        ['label' => 'Autonomie', 'value' => '34 min'],
                        ['label' => 'Portee', 'value' => '20 km'],
                        ['label' => 'Poids', 'value' => '249 g'],
                    ],
                    'platforms' => ['iOS', 'Android'],
                    'use_cases' => ['TikTok', 'YouTube', 'Mariage', 'Voyage', 'Immobilier'],
                    'images' => ['/storage/produits/dji-mini-4-pro.webp'],
                    'featured' => true,
                    'is_new' => true,
                    'is_promo' => true,
                ],
            ],
        ];
    }

    /**
     * @param array<string, mixed> $item
     */
    private function buildSpecifications(array $item, string $domain, string $category, string $subcategory): ?array
    {
        $specs = [
            'overview' => (string) ($item['overview'] ?? ''),
            'tags' => $item['tags'] ?? [],
            'features' => $item['features'] ?? [],
            'platforms' => $item['platforms'] ?? [],
            'use_cases' => $item['use_cases'] ?? [],
            'technical_specs' => $item['technical_specs'] ?? [],
            'taxonomy' => [
                'domain' => $domain,
                'category' => $category,
                'subcategory' => $subcategory,
                'series' => $item['model'] ?? null,
            ],
        ];

        $hasContent = false;
        foreach ($specs as $value) {
            if (is_array($value) && count($value) > 0) {
                $hasContent = true;
                break;
            }
            if (is_string($value) && trim($value) !== '') {
                $hasContent = true;
                break;
            }
        }

        return $hasContent ? $specs : null;
    }

    /**
     * @param array<int, string> $images
     */
    private function syncImages(int $productId, string $title, array $images): void
    {
        DB::table('images')
            ->where('imageable_type', 'PRODUIT')
            ->where('imageable_id', $productId)
            ->delete();

        foreach (array_values(array_unique(array_filter($images))) as $index => $image) {
            $url = trim((string) $image);
            if ($url === '') {
                continue;
            }

            $path = $url;
            if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
                $path = parse_url($url, PHP_URL_PATH) ?: $url;
            }

            $path = ltrim($path, '/');

            DB::table('images')->insert([
                'url' => $url,
                'path' => $path,
                'alt' => sprintf('%s - visuel %d', $title, $index + 1),
                'imageable_type' => 'PRODUIT',
                'imageable_id' => $productId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
