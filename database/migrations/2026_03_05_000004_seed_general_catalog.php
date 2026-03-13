<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        $now = now();
        $idPays = 1;

        $categories = [
            [
                'nom' => 'Informatique',
                'description' => 'Ordinateurs, peripheriques et accessoires professionnels.',
                'image' => '/images/solutions/im1.jpg',
                'segment' => 'general',
            ],
            [
                'nom' => 'Drones',
                'description' => 'Drones professionnels, capteurs et formations associees.',
                'image' => '/images/solutions/im4.png',
                'segment' => 'general',
            ],
            [
                'nom' => 'Imprimantes',
                'description' => 'Imprimantes laser, consommables et maintenance.',
                'image' => '/images/solutions/im2.jpg',
                'segment' => 'general',
            ],
            [
                'nom' => 'Reseaux & Telecom',
                'description' => 'Routeurs, switches, wifi entreprise et telecom.',
                'image' => '/images/solutions/im3.jpg',
                'segment' => 'general',
            ],
            [
                'nom' => 'Accessoires IT',
                'description' => 'Cables, hubs, onduleurs et accessoires essentiels.',
                'image' => '/images/offers/offre1.jpg',
                'segment' => 'general',
            ],
        ];

        foreach ($categories as $cat) {
            $exists = DB::table('categories_produits')->where('nom', $cat['nom'])->exists();
            if ($exists) {
                DB::table('categories_produits')
                    ->where('nom', $cat['nom'])
                    ->update([
                        'slug' => Str::slug($cat['nom']),
                        'description' => $cat['description'],
                        'image' => $cat['image'],
                        'image_url' => $cat['image'],
                        'segment' => $cat['segment'],
                        'actif' => true,
                        'updated_at' => $now,
                    ]);
            } else {
                DB::table('categories_produits')->insert([
                    'nom' => $cat['nom'],
                    'slug' => Str::slug($cat['nom']),
                    'description' => $cat['description'],
                    'image' => $cat['image'],
                    'image_url' => $cat['image'],
                    'segment' => $cat['segment'],
                    'actif' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        $categoryRows = DB::table('categories_produits')
            ->where('segment', 'general')
            ->get(['id_categorie', 'nom']);

        $productsPerCategory = 4;
        foreach ($categoryRows as $cat) {
            for ($i = 1; $i <= $productsPerCategory; $i++) {
                $title = $cat->nom . ' - Serie ' . $i;
                $slug = Str::slug($title);

                DB::table('produits')->updateOrInsert(
                    ['slug' => $slug],
                    [
                        'titre' => $title,
                        'slug' => $slug,
                        'description' => 'Produit ' . $i . ' pour la categorie ' . $cat->nom . '.',
                        'description_courte' => 'Serie ' . $i . ' - ' . $cat->nom,
                        'prix' => 80000 + ($i * 15000),
                        'prix_promo' => null,
                        'stock' => 8 + $i,
                        'stock_alerte' => 3,
                        'statut' => 'disponible',
                        'marque' => 'ISD AFRIK',
                        'modele' => 'ISD-' . strtoupper(Str::substr(Str::slug($cat->nom), 0, 6)) . '-' . $i,
                        'garantie' => '1 an',
                        'specifications' => json_encode([
                            'usage' => 'professionnel',
                            'serie' => 'G' . $i,
                        ]),
                        'est_en_vedette' => $i === 1,
                        'est_nouveau' => $i <= 2,
                        'en_promo' => false,
                        'vues' => 0,
                        'note_moyenne' => 0,
                        'nombre_avis' => 0,
                        'id_categorie' => $cat->id_categorie,
                        'id_pays' => $idPays,
                        'date_creation' => $now,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );

                $productId = DB::table('produits')->where('slug', $slug)->value('id_produit');
                if ($productId) {
                    $imageUrl = '/images/home/hero-5.png';
                    DB::table('images')->updateOrInsert(
                        [
                            'imageable_type' => 'PRODUIT',
                            'imageable_id' => $productId,
                            'url' => $imageUrl,
                        ],
                        [
                            'path' => ltrim($imageUrl, '/'),
                            'alt' => $title,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );
                }
            }
        }
    }

    public function down(): void
    {
        $categoryIds = DB::table('categories_produits')
            ->where('segment', 'general')
            ->pluck('id_categorie');

        if ($categoryIds->isNotEmpty()) {
            $productIds = DB::table('produits')
                ->whereIn('id_categorie', $categoryIds)
                ->pluck('id_produit');

            if ($productIds->isNotEmpty()) {
                DB::table('images')
                    ->where('imageable_type', 'PRODUIT')
                    ->whereIn('imageable_id', $productIds)
                    ->delete();

                DB::table('produits')
                    ->whereIn('id_produit', $productIds)
                    ->delete();
            }

            DB::table('categories_produits')
                ->whereIn('id_categorie', $categoryIds)
                ->delete();
        }
    }
};
