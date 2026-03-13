<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        $now = now();
        $categories = [
            [
                'nom' => 'Cameras',
                'description' => 'Cameras professionnelles pour la surveillance et l’analyse video.',
                'segment' => 'geovision',
                'image_url' => '/images/geovision/cam1.png',
            ],
            [
                'nom' => 'Ecrans & Moniteurs',
                'description' => 'Ecrans de supervision, murs d’images et moniteurs securises.',
                'segment' => 'geovision',
                'image_url' => '/images/geovision/cam1.png',
            ],
            [
                'nom' => 'Cameras IP',
                'description' => 'Cameras IP haute resolution pour reseaux d’entreprise.',
                'segment' => 'geovision',
                'image_url' => '/images/geovision/cam1.png',
            ],
            [
                'nom' => 'Systemes de surveillance',
                'description' => 'Solutions completes de surveillance et enregistrement.',
                'segment' => 'geovision',
                'image_url' => '/images/geovision/cam1.png',
            ],
            [
                'nom' => 'Logiciel de gestion video (VMS)',
                'description' => 'Supervision, analyse video et gestion multi-sites.',
                'segment' => 'geovision',
                'image_url' => '/images/geovision/cam1.png',
            ],
            [
                'nom' => 'Controle d\'acces',
                'description' => 'Controle d’acces, badges, lecteurs et integrations.',
                'segment' => 'geovision',
                'image_url' => '/images/geovision/cam1.png',
            ],
            [
                'nom' => 'Reconnaissance plaques (LPR)',
                'description' => 'Reconnaissance automatique des plaques d’immatriculation.',
                'segment' => 'geovision',
                'image_url' => '/images/geovision/cam1.png',
            ],
            [
                'nom' => 'Signaletique numerique',
                'description' => 'Affichage dynamique et diffusion de contenu en temps reel.',
                'segment' => 'geovision',
                'image_url' => '/images/geovision/cam1.png',
            ],
            [
                'nom' => 'Solutions PoE',
                'description' => 'Switches, injecteurs et solutions d’alimentation PoE.',
                'segment' => 'geovision',
                'image_url' => '/images/geovision/cam1.png',
            ],
            [
                'nom' => 'Accessoires',
                'description' => 'Supports, boitiers, cables et accessoires.',
                'segment' => 'geovision',
                'image_url' => '/images/geovision/cam1.png',
            ],
        ];

        foreach ($categories as $cat) {
            // Insert/update both possible category tables to handle historical naming differences
            DB::table('categorie_produits')->updateOrInsert(
                ['nom' => $cat['nom']],
                [
                    'description' => $cat['description'],
                    'segment' => $cat['segment'],
                    'image_url' => $cat['image_url'],
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );

            // Also ensure the canonical table used by foreign keys exists and is populated
            // Ensure row exists in canonical table without relying on unique constraints
            $exists = DB::table('categories_produits')->where('nom', $cat['nom'])->exists();
            if ($exists) {
                DB::table('categories_produits')
                    ->where('nom', $cat['nom'])
                    ->update([
                        'slug' => \Illuminate\Support\Str::slug($cat['nom']),
                        'description' => $cat['description'],
                        'image' => $cat['image_url'],
                        'actif' => true,
                        'updated_at' => $now,
                    ]);
            } else {
                DB::table('categories_produits')->insert([
                    'nom' => $cat['nom'],
                    'slug' => \Illuminate\Support\Str::slug($cat['nom']),
                    'description' => $cat['description'],
                    'image' => $cat['image_url'],
                    'actif' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        $idPays = 1;
        // Read categories from the canonical table used by produits foreign key
        $categoryRows = DB::table('categories_produits')
            ->get(['id_categorie', 'nom']);

        $productsPerCategory = 5;
        foreach ($categoryRows as $cat) {
            for ($i = 1; $i <= $productsPerCategory; $i++) {
                $title = $cat->nom . ' - Serie ' . $i;
                $slug = Str::slug($title);

                DB::table('produits')->updateOrInsert(
                    ['slug' => $slug],
                    [
                        'titre' => $title,
                        'slug' => $slug,
                        'description' => 'Produit Geovision ' . $i . ' pour la categorie ' . $cat->nom . '.',
                        'description_courte' => 'Serie ' . $i . ' - ' . $cat->nom,
                        'prix' => 150000 + ($i * 25000),
                        'prix_promo' => null,
                        'stock' => 10 + $i,
                        'stock_alerte' => 3,
                        'statut' => 'disponible',
                        'marque' => 'Geovision',
                        'modele' => 'GV-' . strtoupper(Str::substr(Str::slug($cat->nom), 0, 6)) . '-' . $i,
                        'garantie' => '1 an',
                        'specifications' => json_encode([
                            'resolution' => '1080p',
                            'usage' => 'surveillance',
                            'serie' => 'S' . $i,
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
                    DB::table('images')->updateOrInsert(
                        [
                            'imageable_type' => 'PRODUIT',
                            'imageable_id' => $productId,
                            'url' => '/images/geovision/cam1.png',
                        ],
                        [
                            'path' => 'images/geovision/cam1.png',
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
        $categoryIds = DB::table('categorie_produits')
            ->where('segment', 'geovision')
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
        }
    }
};
