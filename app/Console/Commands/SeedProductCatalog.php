<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SeedProductCatalog extends Command
{
    protected $signature = 'catalog:seed {--dry-run : Afficher sans exécuter}';

    protected $description = 'Peupler les catégories vides avec des produits réels et images';

    private $paysId;

    private $userId;

    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $this->paysId = DB::table('pays')->value('id_pays');
        $this->userId = DB::table('utilisateurs')
            ->where('role', 'superadmin')
            ->orderBy('created_at')
            ->value('id_utilisateur');

        if (! $this->paysId || ! $this->userId) {
            $this->error('Pays ou utilisateur introuvable');

            return 1;
        }

        $created = 0;

        // Catégories à peupler: slug => [liste de produits]
        $productMap = $this->getProductMap();

        foreach ($productMap as $catSlug => $products) {
            $catId = DB::table('categories_produits')->where('slug', $catSlug)->value('id_categorie');
            if (! $catId) {
                $this->warn("Catégorie introuvable: {$catSlug}");

                continue;
            }

            foreach ($products as $p) {
                $slug = Str::slug($p['titre'] ?? $p['modele']);

                // Check slug uniqueness
                $existing = DB::table('produits')->where('slug', $slug)->exists();
                if ($existing) {
                    $slug .= '-'.Str::random(4);
                }

                // Check reference uniqueness
                $ref = $p['reference'] ?? strtoupper(Str::random(8));
                $refExists = DB::table('produits')->where('reference', $ref)->exists();
                if ($refExists) {
                    $ref = strtoupper(substr($p['marque'], 0, 4)).'-'.Str::random(6);
                }

                $productId = (string) Str::uuid();

                if ($dryRun) {
                    $this->line("[DRY-RUN] Créerait: {$p['titre']} ({$p['marque']} {$p['modele']}) → {$catSlug}");
                    $created++;

                    continue;
                }

                DB::table('produits')->insert([
                    'id_produit' => $productId,
                    'titre' => $p['titre'],
                    'slug' => $slug,
                    'reference' => $ref,
                    'description_courte' => $p['description'] ?? "{$p['marque']} {$p['modele']} - {$p['titre']}",
                    'prix' => $p['prix'],
                    'prix_promo' => $p['prix_promo'] ?? null,
                    'statut' => 'disponible',
                    'stock' => rand(5, 50),
                    'stock_alerte' => 5,
                    'marque' => $p['marque'],
                    'modele' => $p['modele'],
                    'garantie' => $p['garantie'] ?? ($p['prix'] > 500000 ? '2 an(s)' : '1 an(s)'),
                    'poids' => $p['poids'] ?? round(rand(50, 5000) / 100, 2),
                    'est_en_vedette' => $p['vedette'] ?? false,
                    'est_nouveau' => $p['nouveau'] ?? true,
                    'id_categorie' => $catId,
                    'id_pays' => $this->paysId,
                    'id_utilisateur' => $this->userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Download image from picsum.photos
                $imageSeed = $slug;
                $imageUrl = "https://picsum.photos/seed/{$imageSeed}/600/600";

                try {
                    $response = Http::timeout(15)->get($imageUrl);
                    if ($response->successful() && strlen($response->body()) > 500) {
                        $imgDir = storage_path('app/public/produits');
                        if (! is_dir($imgDir)) {
                            mkdir($imgDir, 0755, true);
                        }

                        $imgName = "prod_{$productId}_".Str::random(6).'.webp';
                        $imgPath = "produits/{$imgName}";
                        file_put_contents("{$imgDir}/{$imgName}", $response->body());

                        DB::table('images')->insert([
                            'id_image' => (string) Str::uuid(),
                            'url' => "/storage/{$imgPath}",
                            'path' => $imgPath,
                            'alt' => "{$p['marque']} {$p['modele']} - visuel",
                            'imageable_type' => 'PRODUIT',
                            'imageable_id' => $productId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                } catch (\Exception $e) {
                    $this->warn("  Image failed for {$p['titre']}: {$e->getMessage()}");
                }

                $created++;
            }
        }

        $this->info("Terminé! {$created} produits créés avec images.");

        return 0;
    }

    private function getProductMap(): array
    {
        return [
            // === SOUS SECURITE INFORMATIQUE ===
            'cables-rj45-securite' => [
                ['titre' => 'Câble RJ45 Cat6 1m', 'marque' => 'Cablescom', 'modele' => 'RJ45-C6-1M', 'prix' => 3500, 'description' => 'Câble réseau RJ45 Cat6 1 mètre, connecteurs dorés.'],
                ['titre' => 'Câble RJ45 Cat6 5m', 'marque' => 'Cablescom', 'modele' => 'RJ45-C6-5M', 'prix' => 6500, 'description' => 'Câble réseau RJ45 Cat6 5 mètres, gaine PVC.'],
                ['titre' => 'Câble RJ45 Cat6a 10m', 'marque' => 'Cablescom', 'modele' => 'RJ45-C6A-10M', 'prix' => 12000, 'description' => 'Câble RJ45 Cat6a 10 mètres blindé S/FTP.'],
            ],
            'fibre-optique-securite' => [
                ['titre' => 'Câble fibre optique SC-SC 3m', 'marque' => 'FibrePro', 'modele' => 'FIB-SCSC-3M', 'prix' => 8500, 'description' => 'Câble fibre optique monomode SC-SC 3 mètres.'],
                ['titre' => 'Câble fibre optique LC-LC 5m', 'marque' => 'FibrePro', 'modele' => 'FIB-LCLC-5M', 'prix' => 9500, 'description' => 'Câble fibre optique duplex LC-LC 5 mètres.'],
                ['titre' => 'Ptich cord fibre optique SC-APC', 'marque' => 'FibrePro', 'modele' => 'FIB-SCAPC-2M', 'prix' => 7200, 'description' => 'Ptich cord fibre SC/APC-SC/APC 2 mètres.'],
            ],
            'cables-ethernet' => [
                ['titre' => 'Câble Ethernet Cat6 2m', 'marque' => 'Cablescom', 'modele' => 'ETH-C6-2M', 'prix' => 4000, 'description' => 'Câble Ethernet Cat6 2 mètres pour archivage.'],
                ['titre' => 'Câble Ethernet Cat7 3m', 'marque' => 'Cablescom', 'modele' => 'ETH-C7-3M', 'prix' => 11000, 'description' => 'Câble Ethernet Cat7 3 mètres blindé.'],
                ['titre' => 'Câble Ethernet Cat5e 10m', 'marque' => 'Cablescom', 'modele' => 'ETH-C5E-10M', 'prix' => 8000, 'description' => 'Câble Ethernet Cat5e 10 mètres pour réseau bureautique.'],
            ],

            // === SOUS ARCHIVAGE NUMERIQUE ===
            'imprimantes-multifonctions' => [
                ['titre' => 'Imprimante multifonction Canon MF744Cdw', 'marque' => 'Canon', 'modele' => 'MF744Cdw', 'prix' => 285000, 'garantie' => '2 an(s)'],
                ['titre' => 'Imprimante multifonction HP LaserJet Pro MFP M428fdw', 'marque' => 'HP', 'modele' => 'M428fdw', 'prix' => 320000, 'garantie' => '2 an(s)'],
                ['titre' => 'Imprimante multifonction Brother MFC-L8900CDW', 'marque' => 'Brother', 'modele' => 'MFC-L8900CDW', 'prix' => 265000, 'garantie' => '2 an(s)'],
            ],
            'photocopieuses' => [
                ['titre' => 'Photocopieuse Canon imageRUNNER 2525', 'marque' => 'Canon', 'modele' => 'iR2525', 'prix' => 890000, 'garantie' => '2 an(s)'],
                ['titre' => 'Photocopieuse Kyocera TASKalfa 2554ci', 'marque' => 'Kyocera', 'modele' => '2554ci', 'prix' => 950000, 'garantie' => '2 an(s)'],
                ['titre' => 'Photocopieuse Ricoh MP 4055SP', 'marque' => 'Ricoh', 'modele' => 'MP4055SP', 'prix' => 1200000, 'garantie' => '2 an(s)'],
            ],
            'relieuses' => [
                ['titre' => 'Relieuse plastique Fellowes Galaxy 500', 'marque' => 'Fellowes', 'modele' => 'Galaxy500', 'prix' => 45000],
                ['titre' => 'Relieuse métallique GBC CombBind C25', 'marque' => 'GBC', 'modele' => 'CombBindC25', 'prix' => 38000],
                ['titre' => 'Relieuse thermique Unibind ThermoBind', 'marque' => 'Unibind', 'modele' => 'ThermoBind', 'prix' => 55000],
            ],
            'destructeurs-documents' => [
                ['titre' => 'Destructeur documents Fellowes P-35C', 'marque' => 'Fellowes', 'modele' => 'P-35C', 'prix' => 65000],
                ['titre' => 'Destructeur documents HSM SECURIO B34', 'marque' => 'HSM', 'modele' => 'SECURIO B34', 'prix' => 180000, 'garantie' => '2 an(s)'],
                ['titre' => 'Destructeur documents Intimus 45SC2', 'marque' => 'Intimus', 'modele' => '45SC2', 'prix' => 250000, 'garantie' => '2 an(s)'],
            ],
            'scanners-plat' => [
                ['titre' => 'Scanner à plat Epson Perfection V39', 'marque' => 'Epson', 'modele' => 'Perfection V39', 'prix' => 85000],
                ['titre' => 'Scanner à plat Canon CanoScan LiDE 400', 'marque' => 'Canon', 'modele' => 'LiDE 400', 'prix' => 72000],
                ['titre' => 'Scanner à plat HP ScanJet Pro 2500 f1', 'marque' => 'HP', 'modele' => 'ScanJet 2500', 'prix' => 120000],
            ],
            'scanners-haute-vitesse' => [
                ['titre' => 'Scanner haute vitesse Fujitsu fi-7160', 'marque' => 'Fujitsu', 'modele' => 'fi-7160', 'prix' => 450000, 'garantie' => '2 an(s)', 'vedette' => true],
                ['titre' => 'Scanner haute vitesse Canon DR-C225W II', 'marque' => 'Canon', 'modele' => 'DR-C225W II', 'prix' => 320000, 'garantie' => '2 an(s)'],
                ['titre' => 'Scanner haute vitesse Kodak Alaris S2060w', 'marque' => 'Kodak Alaris', 'modele' => 'S2060w', 'prix' => 580000, 'garantie' => '2 an(s)'],
            ],
            'scanners-recto-verso' => [
                ['titre' => 'Scanner recto-verso Epson WorkForce DS-770', 'marque' => 'Epson', 'modele' => 'DS-770', 'prix' => 380000, 'garantie' => '2 an(s)'],
                ['titre' => 'Scanner recto-verso Brother ADS-2800W', 'marque' => 'Brother', 'modele' => 'ADS-2800W', 'prix' => 280000, 'garantie' => '2 an(s)'],
                ['titre' => 'Scanner recto-verso Fujitsu fi-8170', 'marque' => 'Fujitsu', 'modele' => 'fi-8170', 'prix' => 520000, 'garantie' => '2 an(s)', 'vedette' => true],
            ],
            'scanners-livres' => [
                ['titre' => 'Scanner de livres CZUR Aura X Pro', 'marque' => 'CZUR', 'modele' => 'Aura X Pro', 'prix' => 210000, 'garantie' => '2 an(s)', 'vedette' => true],
                ['titre' => 'Scanner de livres Bookeye 5 V2', 'marque' => 'Bookeye', 'modele' => '5 V2', 'prix' => 1800000, 'garantie' => '3 an(s)'],
                ['titre' => 'Scanner de livres Plustek OpticBook 4800', 'marque' => 'Plustek', 'modele' => 'OpticBook 4800', 'prix' => 155000],
            ],
            'scanners-portables' => [
                ['titre' => 'Scanner portable Brother DS-940DW', 'marque' => 'Brother', 'modele' => 'DS-940DW', 'prix' => 145000],
                ['titre' => 'Scanner portable Epson WorkForce ES-50', 'marque' => 'Epson', 'modele' => 'ES-50', 'prix' => 95000],
                ['titre' => 'Scanner portable Fujitsu ScanSnap iX1300', 'marque' => 'Fujitsu', 'modele' => 'iX1300', 'prix' => 195000],
            ],
            'appareils-photo-numeriques' => [
                ['titre' => 'Appareil photo Canon EOS R50', 'marque' => 'Canon', 'modele' => 'EOS R50', 'prix' => 450000, 'garantie' => '2 an(s)', 'vedette' => true],
                ['titre' => 'Appareil photo Nikon Z30', 'marque' => 'Nikon', 'modele' => 'Z30', 'prix' => 420000, 'garantie' => '2 an(s)'],
                ['titre' => 'Appareil photo Sony Alpha ZV-E10', 'marque' => 'Sony', 'modele' => 'ZV-E10', 'prix' => 480000, 'garantie' => '2 an(s)'],
            ],
            'disques-durs-externes' => [
                ['titre' => 'Disque dur externe Seagate 2To Backup Plus', 'marque' => 'Seagate', 'modele' => 'Backup Plus 2To', 'prix' => 45000],
                ['titre' => 'Disque dur externe WD 4To My Passport', 'marque' => 'Western Digital', 'modele' => 'My Passport 4To', 'prix' => 72000],
                ['titre' => 'Disque dur externe Toshiba Canvio Basics 1To', 'marque' => 'Toshiba', 'modele' => 'Canvio Basics 1To', 'prix' => 32000],
            ],

            // === SOUS MATERIEL ET CONSOMMABLES ===
            'videoprojecteurs' => [
                ['titre' => 'Vidéoprojecteur Epson EH-TW6250', 'marque' => 'Epson', 'modele' => 'EH-TW6250', 'prix' => 520000, 'garantie' => '2 an(s)'],
                ['titre' => 'Vidéoprojecteur BenQ MH560', 'marque' => 'BenQ', 'modele' => 'MH560', 'prix' => 380000, 'garantie' => '2 an(s)'],
                ['titre' => 'Vidéoprojecteur Optoma UHD38', 'marque' => 'Optoma', 'modele' => 'UHD38', 'prix' => 650000, 'garantie' => '2 an(s)', 'vedette' => true],
            ],
            'claviers' => [
                ['titre' => 'Clavier Logitech MX Keys', 'marque' => 'Logitech', 'modele' => 'MX Keys', 'prix' => 45000],
                ['titre' => 'Clavier Microsoft Surface Keyboard', 'marque' => 'Microsoft', 'modele' => 'Surface Keyboard', 'prix' => 38000],
                ['titre' => 'Clavier mécanique Corsair K55 RGB', 'marque' => 'Corsair', 'modele' => 'K55 RGB', 'prix' => 28000],
            ],
            'souris' => [
                ['titre' => 'Souris Logitech MX Master 3S', 'marque' => 'Logitech', 'modele' => 'MX Master 3S', 'prix' => 35000, 'vedette' => true],
                ['titre' => 'Souris Microsoft Bluetooth Ergonomic', 'marque' => 'Microsoft', 'modele' => 'Bluetooth Ergonomic', 'prix' => 25000],
                ['titre' => 'Souris Razer DeathAdder V2', 'marque' => 'Razer', 'modele' => 'DeathAdder V2', 'prix' => 18000],
            ],
            'casques-audio' => [
                ['titre' => 'Casque audio Sony WH-1000XM5', 'marque' => 'Sony', 'modele' => 'WH-1000XM5', 'prix' => 145000, 'garantie' => '2 an(s)', 'vedette' => true],
                ['titre' => 'Casque audio Bose QuietComfort 45', 'marque' => 'Bose', 'modele' => 'QC45', 'prix' => 135000, 'garantie' => '2 an(s)'],
                ['titre' => 'Casque audio Jabra Evolve2 85', 'marque' => 'Jabra', 'modele' => 'Evolve2 85', 'prix' => 165000, 'garantie' => '2 an(s)'],
            ],
            'imprimantes-laser' => [
                ['titre' => 'Imprimante laser HP Color LaserJet Pro M255dw', 'marque' => 'HP', 'modele' => 'M255dw', 'prix' => 195000, 'garantie' => '2 an(s)'],
                ['titre' => 'Imprimante laser Brother HL-L2370DW', 'marque' => 'Brother', 'modele' => 'HL-L2370DW', 'prix' => 85000],
                ['titre' => 'Imprimante laser Canon imageCLASS LBP226dw', 'marque' => 'Canon', 'modele' => 'LBP226dw', 'prix' => 165000, 'garantie' => '2 an(s)'],
            ],
            'haut-parleurs' => [
                ['titre' => 'Enceinte Bluetooth JBL Charge 5', 'marque' => 'JBL', 'modele' => 'Charge 5', 'prix' => 55000],
                ['titre' => 'Enceinte Bose SoundLink Revolve+', 'marque' => 'Bose', 'modele' => 'SoundLink Revolve+', 'prix' => 95000],
                ['titre' => 'Haut-parleur Logitech Z407', 'marque' => 'Logitech', 'modele' => 'Z407', 'prix' => 42000],
            ],
            'traceurs' => [
                ['titre' => 'Traceur HP DesignJet T250', 'marque' => 'HP', 'modele' => 'DesignJet T250', 'prix' => 1250000, 'garantie' => '2 an(s)', 'vedette' => true],
                ['titre' => 'Traceur Canon imagePROGRAF TM-340', 'marque' => 'Canon', 'modele' => 'TM-340', 'prix' => 1450000, 'garantie' => '2 an(s)'],
                ['titre' => 'Traceur Epson SureColor T3470', 'marque' => 'Epson', 'modele' => 'SureColor T3470', 'prix' => 1350000, 'garantie' => '2 an(s)'],
            ],

            // === SOUS TPE ===
            'tpe-fixe' => [
                ['titre' => 'TPE fixe Ingenico IWL250', 'marque' => 'Ingenico', 'modele' => 'IWL250', 'prix' => 180000, 'garantie' => '2 an(s)'],
                ['titre' => 'TPE fixe Verifone VX 820', 'marque' => 'Verifone', 'modele' => 'VX 820', 'prix' => 165000, 'garantie' => '2 an(s)'],
                ['titre' => 'TPE fixe PAX S920', 'marque' => 'PAX', 'modele' => 'S920', 'prix' => 155000, 'garantie' => '2 an(s)'],
            ],
            'tpe-virtuel' => [
                ['titre' => 'Solution e-TPE Izitel', 'marque' => 'Izitel', 'modele' => 'e-TPE Pro', 'prix' => 75000, 'description' => 'Solution de paiement virtuel par lien de paiement.'],
                ['titre' => 'TPE virtuel SmilePay', 'marque' => 'SmilePay', 'modele' => 'Virtual Terminal', 'prix' => 50000, 'description' => 'Terminal de paiement virtuel pour e-commerce.'],
                ['titre' => 'API Paiement Teletic Connect', 'marque' => 'Teletic', 'modele' => 'Connect API', 'prix' => 45000, 'description' => 'API de paiement sécurisé pour sites web.'],
            ],
            'tpe-portable' => [
                ['titre' => 'TPE portable Ingenico Move 3500', 'marque' => 'Ingenico', 'modele' => 'Move 3500', 'prix' => 285000, 'garantie' => '2 an(s)', 'vedette' => true],
            ],
            'tpe-mobile' => [
                ['titre' => 'TPE mobile PAX A77', 'marque' => 'PAX', 'modele' => 'A77', 'prix' => 310000, 'garantie' => '2 an(s)'],
            ],
            'tpe-smart-android' => [
                ['titre' => 'Smart TPE PAX A920 Plus', 'marque' => 'PAX', 'modele' => 'A920 Plus', 'prix' => 350000, 'garantie' => '2 an(s)', 'vedette' => true],
            ],

            // === SOUS DRONE ===
            'drones-loisir' => [
                ['titre' => 'Drone DJI Mini 4 Pro', 'marque' => 'DJI', 'modele' => 'Mini 4 Pro', 'prix' => 450000, 'garantie' => '2 an(s)', 'vedette' => true],
                ['titre' => 'Drone Autel EVO Nano+', 'marque' => 'Autel', 'modele' => 'EVO Nano+', 'prix' => 380000, 'garantie' => '2 an(s)'],
                ['titre' => 'Drone Ryze Tello', 'marque' => 'Ryze', 'modele' => 'Tello', 'prix' => 75000],
            ],
            'drones-photographie-video' => [
                ['titre' => 'Drone DJI Air 3', 'marque' => 'DJI', 'modele' => 'Air 3', 'prix' => 780000, 'garantie' => '2 an(s)', 'vedette' => true],
                ['titre' => 'Drone camera DJI Mavic 3 Pro', 'marque' => 'DJI', 'modele' => 'Mavic 3 Pro', 'prix' => 1250000, 'garantie' => '2 an(s)'],
                ['titre' => 'Drone Autel Robotics EVO II Pro', 'marque' => 'Autel', 'modele' => 'EVO II Pro', 'prix' => 850000, 'garantie' => '2 an(s)'],
            ],
            'drones-industriels' => [
                ['titre' => 'Drone DJI Matrice 350 RTK', 'marque' => 'DJI', 'modele' => 'Matrice 350 RTK', 'prix' => 3200000, 'garantie' => '3 an(s)', 'vedette' => true],
                ['titre' => 'Drone DJI Agras T40', 'marque' => 'DJI', 'modele' => 'Agras T40', 'prix' => 4500000, 'garantie' => '3 an(s)'],
                ['titre' => 'Drone inspecteur Elios 3', 'marque' => 'Flyability', 'modele' => 'Elios 3', 'prix' => 4800000, 'garantie' => '3 an(s)'],
            ],

            // === SOUS CONTROLE D'ACCES ===
            'lecteur-badge' => [
                ['titre' => 'Lecteur badge HID iCLASS SE RB25F', 'marque' => 'HID', 'modele' => 'RB25F', 'prix' => 85000],
                ['titre' => 'Lecteur badge Paxton Net2 Plus', 'marque' => 'Paxton', 'modele' => 'Net2 Plus', 'prix' => 72000],
                ['titre' => 'Lecteur badge STid SECard Architect', 'marque' => 'STid', 'modele' => 'SECard Architect', 'prix' => 95000, 'vedette' => true],
            ],
            'lecteur-empreinte' => [
                ['titre' => 'Lecteur empreinte HID Lumidigm M310', 'marque' => 'HID', 'modele' => 'Lumidigm M310', 'prix' => 145000, 'garantie' => '2 an(s)', 'vedette' => true],
                ['titre' => 'Lecteur empreinte Suprema BioStation 2', 'marque' => 'Suprema', 'modele' => 'BioStation 2', 'prix' => 165000, 'garantie' => '2 an(s)'],
                ['titre' => 'Lecteur empreinte ZKTeco inBio460', 'marque' => 'ZKTeco', 'modele' => 'inBio460', 'prix' => 125000, 'garantie' => '2 an(s)'],
            ],
            'lecteur-code' => [
                ['titre' => 'Clavier code STid BlueBox ID', 'marque' => 'STid', 'modele' => 'BlueBox ID', 'prix' => 45000],
                ['titre' => 'Clavier code HID ProxKeypad', 'marque' => 'HID', 'modele' => 'ProxKeypad', 'prix' => 38000],
                ['titre' => 'Lecteur code Paxton Switch2 Keypad', 'marque' => 'Paxton', 'modele' => 'Switch2 Keypad', 'prix' => 42000],
            ],
            'lecteur-retine' => [
                ['titre' => 'Lecteur rétine Iris ID iCAM TD100', 'marque' => 'Iris ID', 'modele' => 'iCAM TD100', 'prix' => 520000, 'garantie' => '2 an(s)', 'vedette' => true],
                ['titre' => 'Lecteur rétine BioID Connect', 'marque' => 'BioID', 'modele' => 'Connect', 'prix' => 480000, 'garantie' => '2 an(s)'],
            ],
            'lecteurs-acces-autre' => [
                ['titre' => 'Lecteur RFID UHF Alien ALR-9900', 'marque' => 'Alien', 'modele' => 'ALR-9900', 'prix' => 280000, 'garantie' => '2 an(s)'],
                ['titre' => 'Lecteur biométrique facial ZKTeco Face ID 5', 'marque' => 'ZKTeco', 'modele' => 'Face ID 5', 'prix' => 185000, 'garantie' => '2 an(s)', 'vedette' => true],
            ],

            // === INCENDIE ===
            'extincteur-eau' => [
                ['titre' => 'Extincteur eau 6L', 'marque' => 'Eurofeu', 'modele' => 'ED-6L', 'prix' => 25000],
                ['titre' => 'Extincteur eau 9L', 'marque' => 'Eurofeu', 'modele' => 'ED-9L', 'prix' => 32000],
                ['titre' => 'Extincteur eau 12L', 'marque' => 'Sicli', 'modele' => 'EA-12L', 'prix' => 42000],
            ],
            'extincteur-co2' => [
                ['titre' => 'Extincteur CO2 2kg', 'marque' => 'Eurofeu', 'modele' => 'CO2-2KG', 'prix' => 35000],
                ['titre' => 'Extincteur CO2 5kg', 'marque' => 'Eurofeu', 'modele' => 'CO2-5KG', 'prix' => 48000],
                ['titre' => 'Extincteur CO2 10kg', 'marque' => 'Sicli', 'modele' => 'CO2-10KG', 'prix' => 65000],
            ],
            'extincteur-poudre' => [
                ['titre' => 'Extincteur poudre ABC 6kg', 'marque' => 'Eurofeu', 'modele' => 'ABC-6KG', 'prix' => 22000],
                ['titre' => 'Extincteur poudre ABC 9kg', 'marque' => 'Eurofeu', 'modele' => 'ABC-9KG', 'prix' => 28000],
                ['titre' => 'Extincteur poudre BC 12kg', 'marque' => 'Sicli', 'modele' => 'BC-12KG', 'prix' => 38000],
            ],
        ];
    }
}
