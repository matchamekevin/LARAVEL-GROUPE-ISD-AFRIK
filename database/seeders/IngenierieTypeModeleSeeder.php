<?php

namespace Database\Seeders;

use App\Models\CategorieProduit;
use App\Models\Pays;
use App\Models\Produit;
use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class IngenierieTypeModeleSeeder extends Seeder
{
    public function run(): void
    {
        $paysId = Pays::query()->value('id_pays');
        $userId = Utilisateur::query()->value('id_utilisateur');

        if (!$paysId || !$userId) {
            $this->command?->warn('Seeder ignore: pays ou utilisateur manquant.');
            return;
        }

        $root = CategorieProduit::query()->where('slug', 'catalogue-produits-techniques')->first();

        if (!$root) {
            $this->command?->warn('Seeder ignore: racine catalogue-produits-techniques introuvable.');
            return;
        }

        $categories = CategorieProduit::query()
            ->where('segment', 'general')
            ->get(['id_categorie', 'parent_id', 'nom', 'slug']);

        $childrenByParent = [];
        foreach ($categories as $category) {
            if ($category->parent_id) {
                $childrenByParent[(int) $category->parent_id][] = (int) $category->id_categorie;
            }
        }

        $descendantIds = [];
        $stack = [(int) $root->id_categorie];
        while (!empty($stack)) {
            $current = array_pop($stack);
            if (in_array($current, $descendantIds, true)) {
                continue;
            }

            $descendantIds[] = $current;
            foreach ($childrenByParent[$current] ?? [] as $childId) {
                $stack[] = $childId;
            }
        }

        $leafCategories = $categories
            ->filter(function ($category) use ($descendantIds, $childrenByParent, $root) {
                $id = (int) $category->id_categorie;
                if (!in_array($id, $descendantIds, true)) {
                    return false;
                }

                if ($id === (int) $root->id_categorie) {
                    return false;
                }

                return empty($childrenByParent[$id]);
            })
            ->values();

        $modelsBySlug = [
            'tpe' => ['Ingenico Move/5000', 'Verifone VX680', 'PAX A920'],
            'drone' => ['DJI Matrice 350 RTK', 'DJI Mavic 3 Enterprise', 'Autel EVO II Pro'],
            'scanner-documentaire' => ['Fujitsu fi-8170', 'Kodak Alaris S2085f', 'Epson WorkForce DS-870'],
            'baie-nas' => ['Synology DS923+', 'QNAP TS-464', 'Asustor Lockerstor 4'],
            'serveur-sauvegarde' => ['Dell PowerEdge R550', 'HPE ProLiant DL380 Gen11', 'Lenovo ThinkSystem SR630 V2'],
            'logiciel-ged' => ['Alfresco Content Services', 'OpenText Content Suite', 'M-Files'],
            'ordinateur-portable' => ['Dell Latitude 5540', 'HP ProBook 450 G10', 'Lenovo ThinkPad E14 Gen 5'],
            'ordinateur-bureau' => ['Dell OptiPlex 7010', 'HP ProDesk 400 G9', 'Lenovo ThinkCentre M75s Gen 2'],
            'serveur-rack' => ['Dell PowerEdge R650', 'HPE ProLiant DL360 Gen10', 'Lenovo ThinkSystem SR650 V2'],
            'imprimante-professionnelle' => ['HP LaserJet Enterprise MFP M430f', 'Brother MFC-L6900DW', 'Canon i-SENSYS MF754Cdw'],
            'switch-manage' => ['Cisco C9300X-48HX', 'Aruba 6200F 48G', 'Ubiquiti USW-Pro-48-PoE'],
            'routeur-entreprise' => ['Cisco ISR 4331', 'MikroTik CCR2004-1G-12S+2XS', 'Peplink Balance 310X'],
            'point-acces-wifi' => ['Cisco Catalyst 9130AXI', 'Aruba AP-515', 'Ubiquiti U6 Pro'],
            'pare-feu-reseau' => ['Fortinet FortiGate 60F', 'Sophos XGS 2100', 'Palo Alto PA-440'],
            'extincteur' => ['Extincteur ABC 6kg', 'Extincteur CO2 5kg', 'Extincteur Eau additif 9L'],
            'ria' => ['RIA DN25 30m', 'RIA DN19 20m', 'RIA pivotant mural'],
            'detecteur-fumee' => ['Honeywell ECO1003', 'Siemens OP720', 'Apollo XP95 Optical'],
            'detecteur-humidite' => ['Ajax LeaksProtect', 'Honeywell WLD2', 'Fibaro Flood Sensor'],
            'sirene' => ['Bosch FNM-420-A-BS', 'Honeywell WSS-PC-I02', 'Ajax StreetSiren'],
            'autocom' => ['Grandstream UCM6302A', 'Panasonic KX-NS500', 'Yeastar S100'],
            'telephone-ip' => ['Yealink SIP-T54W', 'Cisco 8841', 'Grandstream GXP2170'],
            'passerelle-voip' => ['Grandstream GXW4108', 'Cisco ATA191', 'Yeastar TG200'],
            'routeur-4g-5g' => ['Teltonika RUTX50', 'Huawei AR502H', 'Peplink MAX BR1 Pro 5G'],
            'antivirus-edr' => ['Kaspersky Endpoint Security', 'Bitdefender GravityZone', 'Microsoft Defender for Endpoint'],
            'siem-soc' => ['Splunk Enterprise Security', 'IBM QRadar SIEM', 'Elastic Security'],
            'sauvegarde-base-de-donnees' => ['Veeam Backup & Replication', 'Acronis Cyber Protect', 'Commvault Complete'],
            'pare-feu-applicatif-bdd' => ['Imperva SecureSphere', 'F5 Advanced WAF', 'Oracle Database Firewall'],
            'onduleur' => ['APC Smart-UPS SMT2200IC', 'Eaton 9E 3000i', 'Vertiv Liebert GXT5-3000IRT2UXL'],
            'groupe-electrique' => ['Cummins C33D5', 'FG Wilson P33-6', 'Pramac GSW45P'],
            'panneau-solaire' => ['LONGi LR5-72HPH-550M', 'Jinko Tiger Neo 565W', 'Trina Vertex S 430W'],
            'regulateur-convertisseur' => ['Victron SmartSolar MPPT 250/100', 'Schneider Conext MPPT 80 600', 'Huawei SUN2000-10KTL-M1'],
        ];

        $brands = ['ISD', 'Cisco', 'Huawei', 'MikroTik', 'APC', 'DJI', 'ZKTeco', 'Dell', 'HP'];

        foreach ($leafCategories as $leaf) {
            $models = $modelsBySlug[$leaf->slug] ?? [
                $leaf->nom . ' Standard',
                $leaf->nom . ' Plus',
                $leaf->nom . ' Pro',
            ];

            foreach (array_slice($models, 0, 3) as $index => $modelName) {
                $serial = $index + 1;
                $reference = sprintf('CAT-%d-%02d', $leaf->id_categorie, $serial);
                $title = sprintf('%s %s', $leaf->nom, $modelName);

                $category = CategorieProduit::query()->find($leaf->id_categorie);
                $mainCategory = optional($category?->parent)->nom;

                Produit::query()->updateOrCreate(
                    ['reference' => $reference],
                    [
                        'uuid' => (string) Str::uuid(),
                        'titre' => $title,
                        'slug' => Str::slug($title . '-' . $leaf->id_categorie . '-' . $serial),
                        'description' => "Produit de demonstration pour la sous-categorie {$leaf->nom}.",
                        'description_courte' => "{$leaf->nom} - modele {$modelName}",
                        'prix' => rand(150000, 3500000),
                        'prix_promo' => null,
                        'stock' => rand(4, 30),
                        'stock_alerte' => 3,
                        'statut' => 'disponible',
                        'marque' => $brands[array_rand($brands)],
                        'modele' => $modelName,
                        'poids' => rand(1, 30),
                        'specifications' => [
                            'taxonomy' => [
                                'domain' => $root->nom,
                                'category' => $mainCategory,
                                'subcategory' => $leaf->nom,
                                'series' => $modelName,
                            ],
                            'tags' => ['demo', 'catalogue', Str::slug($leaf->nom)],
                            'features' => [
                                'Livraison et installation',
                                'Configuration selon votre environnement',
                                'Support de demarrage',
                            ],
                        ],
                        'garantie' => '1 an',
                        'est_en_vedette' => false,
                        'est_nouveau' => true,
                        'en_promo' => false,
                        'vues' => rand(0, 120),
                        'note_moyenne' => 0,
                        'nombre_avis' => 0,
                        'id_categorie' => $leaf->id_categorie,
                        'id_pays' => $paysId,
                        'id_utilisateur' => $userId,
                        'date_creation' => now(),
                    ]
                );
            }
        }
    }
}
