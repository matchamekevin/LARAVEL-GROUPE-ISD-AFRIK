<?php

namespace Database\Seeders;

use App\Models\CategorieProduit;
use App\Models\Pays;
use App\Models\Produit;
use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProduitMinimumPerCategorySeeder extends Seeder
{
    public function run(): void
    {
        $defaultPaysId = Pays::query()->value('id_pays');
        $defaultUserId = Utilisateur::query()->value('id_utilisateur');

        if (!$defaultPaysId || !$defaultUserId) {
            $this->command?->warn('Seeder ignoré: pays ou utilisateur manquant pour créer les produits.');
            return;
        }

        $brands = ['HP', 'Dell', 'Lenovo', 'Asus', 'Canon', 'DJI', 'Samsung', 'Brother', 'Epson'];

        CategorieProduit::query()
            ->orderBy('id_categorie')
            ->get()
            ->each(function (CategorieProduit $categorie) use ($brands, $defaultPaysId, $defaultUserId) {
                if (($categorie->segment ?? null) === 'geovision') {
                    return;
                }

                $existingCount = Produit::query()
                    ->where('id_categorie', $categorie->id_categorie)
                    ->count();

                $missing = max(0, 5 - $existingCount);

                if ($missing === 0) {
                    return;
                }

                for ($index = 1; $index <= $missing; $index++) {
                    $sequence = $existingCount + $index;
                    $brand = $brands[array_rand($brands)];
                    $title = sprintf('%s Produit %d', $categorie->nom, $sequence);
                    $price = rand(75000, 1250000);
                    $promoPrice = rand(0, 1) ? rand(65000, max(65000, $price - 5000)) : null;
                    $colors = ['noir', 'gris', 'blanc'];
                    $connectivity = ['Wi-Fi', 'Ethernet', 'USB-C'];

                    Produit::create([
                        'titre' => $title,
                        'slug' => Str::slug($title . '-' . Str::lower(Str::random(4))),
                        'reference' => strtoupper(Str::random(8)),
                        'description' => sprintf('Description de démonstration pour %s.', $title),
                        'description_courte' => sprintf('%s - disponibilité immédiate', $title),
                        'prix' => $price,
                        'prix_promo' => $promoPrice,
                        'stock' => rand(5, 50),
                        'stock_alerte' => 5,
                        'statut' => 'disponible',
                        'marque' => $brand,
                        'modele' => 'Série ' . rand(100, 999),
                        'poids' => rand(1, 12),
                        'specifications' => [
                            'couleur' => $colors[array_rand($colors)],
                            'puissance' => rand(10, 120) . 'W',
                            'connectivite' => $connectivity[array_rand($connectivity)],
                        ],
                        'garantie' => rand(1, 3) . ' an(s)',
                        'est_en_vedette' => $sequence === 1,
                        'est_nouveau' => (bool) rand(0, 1),
                        'en_promo' => $promoPrice !== null,
                        'vues' => rand(0, 500),
                        'note_moyenne' => rand(35, 50) / 10,
                        'nombre_avis' => rand(0, 80),
                        'id_categorie' => $categorie->id_categorie,
                        'id_pays' => $defaultPaysId,
                        'id_utilisateur' => $defaultUserId,
                        'date_creation' => now(),
                    ]);
                }
            });
    }
}
