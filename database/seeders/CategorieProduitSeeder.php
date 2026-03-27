<?php

namespace Database\Seeders;

use App\Models\CategorieProduit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorieProduitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tree = [
            [
                'nom' => 'Catalogue Produits Techniques',
                'slug' => 'catalogue-produits-techniques',
                'description' => 'Racine du catalogue general des produits techniques.',
                'children' => [
                    [
                        'nom' => 'Ingenierie',
                        'slug' => 'ingenierie',
                        'description' => 'Branche qui regroupe les solutions TPE et drone.',
                        'children' => [
                            ['nom' => 'TPE', 'slug' => 'tpe', 'description' => 'Terminaux de paiement electronique.'],
                            ['nom' => 'Drone', 'slug' => 'drone', 'description' => 'Drones pour cartographie, surveillance et inspection.'],
                        ],
                    ],
                    [
                        'nom' => 'Archivage numerique',
                        'slug' => 'archivage-numerique',
                        'description' => 'Numerisation, conservation et gestion documentaire.',
                        'children' => [
                            ['nom' => 'Scanner documentaire', 'slug' => 'scanner-documentaire'],
                            ['nom' => 'Baie NAS', 'slug' => 'baie-nas'],
                            ['nom' => 'Serveur de sauvegarde', 'slug' => 'serveur-sauvegarde'],
                            ['nom' => 'Logiciel GED', 'slug' => 'logiciel-ged'],
                        ],
                    ],
                    [
                        'nom' => 'Materiel informatique',
                        'slug' => 'materiel-informatique',
                        'description' => 'Postes de travail, serveurs et impression.',
                        'children' => [
                            ['nom' => 'Ordinateur portable', 'slug' => 'ordinateur-portable'],
                            ['nom' => 'Ordinateur de bureau', 'slug' => 'ordinateur-bureau'],
                            ['nom' => 'Serveur rack', 'slug' => 'serveur-rack'],
                            ['nom' => 'Imprimante professionnelle', 'slug' => 'imprimante-professionnelle'],
                        ],
                    ],
                    [
                        'nom' => 'Reseau informatique',
                        'slug' => 'reseau-informatique',
                        'description' => 'Infrastructure LAN/WAN securisee.',
                        'children' => [
                            ['nom' => 'Switch manage', 'slug' => 'switch-manage'],
                            ['nom' => 'Routeur entreprise', 'slug' => 'routeur-entreprise'],
                            ['nom' => 'Point d\'acces Wi-Fi', 'slug' => 'point-acces-wifi'],
                            ['nom' => 'Pare-feu reseau', 'slug' => 'pare-feu-reseau'],
                        ],
                    ],
                    [
                        'nom' => 'Incendie',
                        'slug' => 'incendie',
                        'description' => 'Prevention, detection et alerte incendie.',
                        'children' => [
                            ['nom' => 'Extincteur', 'slug' => 'extincteur'],
                            ['nom' => 'R.I.A', 'slug' => 'ria'],
                            ['nom' => 'Detecteur de fumee', 'slug' => 'detecteur-fumee'],
                            ['nom' => 'Detecteur d\'humidite', 'slug' => 'detecteur-humidite'],
                            ['nom' => 'Sirene', 'slug' => 'sirene'],
                        ],
                    ],
                    [
                        'nom' => 'Telecommunications',
                        'slug' => 'telecommunications',
                        'description' => 'Autocom, VoIP et equipements de communication d\'entreprise.',
                        'children' => [
                            ['nom' => 'Autocom', 'slug' => 'autocom'],
                            ['nom' => 'Telephone IP', 'slug' => 'telephone-ip'],
                            ['nom' => 'Passerelle VoIP', 'slug' => 'passerelle-voip'],
                            ['nom' => 'Routeur 4G/5G', 'slug' => 'routeur-4g-5g'],
                        ],
                    ],
                    [
                        'nom' => 'Securite informatique et base de donnees',
                        'slug' => 'securite-informatique-base-de-donnees',
                        'description' => 'Protection des postes, reseaux, SIEM et bases de donnees.',
                        'children' => [
                            ['nom' => 'Antivirus / EDR', 'slug' => 'antivirus-edr'],
                            ['nom' => 'SIEM / SOC', 'slug' => 'siem-soc'],
                            ['nom' => 'Sauvegarde base de donnees', 'slug' => 'sauvegarde-base-de-donnees'],
                            ['nom' => 'Pare-feu applicatif et BDD', 'slug' => 'pare-feu-applicatif-bdd'],
                        ],
                    ],
                    [
                        'nom' => 'Energie',
                        'slug' => 'energie',
                        'description' => 'Continuite electrique via UPS, groupe et solaire.',
                        'children' => [
                            ['nom' => 'Onduleur', 'slug' => 'onduleur'],
                            ['nom' => 'Groupe electrique', 'slug' => 'groupe-electrique'],
                            ['nom' => 'Panneau solaire', 'slug' => 'panneau-solaire'],
                            ['nom' => 'Regulateur / convertisseur', 'slug' => 'regulateur-convertisseur'],
                        ],
                    ],
                ],
            ],
        ];

        $upsertNode = function (array $node, ?int $parentId = null, int $order = 0) use (&$upsertNode) {
            $slug = $node['slug'] ?? Str::slug($node['nom']);

            $category = CategorieProduit::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'nom' => $node['nom'],
                    'slug' => $slug,
                    'description' => $node['description'] ?? null,
                    'segment' => 'general',
                    'parent_id' => $parentId,
                    'icone' => 'circle',
                    'ordre' => $order,
                    'actif' => true,
                ]
            );

            foreach ($node['children'] ?? [] as $index => $child) {
                $upsertNode($child, (int) $category->id_categorie, $index + 1);
            }
        };

        foreach ($tree as $index => $rootNode) {
            $upsertNode($rootNode, null, $index + 1);
        }
    }
}
