<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CategorieProduit;
use Illuminate\Support\Str;

class CategorieProduitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Catégories principales
        $categories = [
            [
                'nom' => 'Ingénierie',
                'slug' => 'ingenierie',
                'description' => 'Solutions et équipements d\'ingénierie (inspection, géovision, instrumentation)',
                'icone' => 'engineering',
                'actif' => true,
            ],
            [
                'nom' => 'Solutions de gestion d\'entreprise',
                'slug' => 'solutions-gestion-entreprise',
                'description' => 'ERP, logiciels de gestion, comptabilité et RH',
                'icone' => 'server',
                'actif' => true,
            ],
            [
                'nom' => 'Fourniture de drone & formation',
                'slug' => 'drone-formation',
                'description' => 'Drones professionnels et formations au pilotage',
                'icone' => 'drone',
                'actif' => true,
            ],
            [
                'nom' => 'Fourniture de TPE',
                'slug' => 'fourniture-tpe',
                'description' => 'Terminaux de paiement électronique (TPE) et accessoires',
                'icone' => 'credit-card',
                'actif' => true,
            ],
        ];

        foreach ($categories as $cat) {
            CategorieProduit::updateOrCreate(
                ['slug' => $cat['slug']],
                array_merge($cat, ['nom' => $cat['nom']])
            );
        }

        // Sous-catégories pour Ingénierie (12 types)
        $ingenierie = CategorieProduit::where('slug', 'ingenierie')->first();
        if ($ingenierie) {
            $sous = [
                'Inspection', 'Géovision', 'Topographie', 'Cartographie', 'Télédétection',
                'Systèmes embarqués', 'Automatisation', 'Instrumentation', 'Maintenance industrielle',
                'Études & conseils', 'Systèmes de contrôle', 'Capteurs & IoT'
            ];
            $ordre = 1;
            foreach ($sous as $name) {
                CategorieProduit::updateOrCreate(
                    ['slug' => Str::slug('ingenierie-'.$name)],
                    [
                        'nom' => $name,
                        'slug' => Str::slug('ingenierie-'.$name),
                        'description' => "Sous-catégorie $name de Ingénierie",
                        'parent_id' => $ingenierie->id_categorie,
                        'icone' => 'circle',
                        'ordre' => $ordre++,
                        'actif' => true,
                    ]
                );
            }
        }
    }
}
