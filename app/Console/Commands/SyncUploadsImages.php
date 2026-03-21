<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Image;
use App\Models\Formation;

class SyncUploadsImages extends Command
{
    protected $signature = 'images:sync-uploads {--dry-run : Simuler les changements sans les appliquer}';

    protected $description = 'Synchroniser les fichiers dans public/uploads avec la table images (corriger extensions, créer entrées manquantes)';

    protected $formationImageMapping = [];

    public function __construct()
    {
        parent::__construct();

        // Mapping minimal — utilisons le mapping du reset si nécessaire
        $this->formationImageMapping = [
            'gestion commerciale et stock' => 'gestion-commerciale-stock.webp',
            'comptabilité générale' => 'comptabilite-gestion-projets.webp',
            'microsoft excel avancé' => 'excel-avance.webp',
            'videosurveillance' => 'video-surveillance.webp',
            'drones' => 'assistant-direction.webp',
            'extincteurs' => 'gestion-entreprise.webp',
            'transformation digitale' => 'big-data.webp',
            'solutions cloud' => 'dev-application-api.webp',
            'web & mobile' => 'web-wordpress.webp',
            'web mobile' => 'web-wordpress.webp',
            'marketing digital' => 'seo-referencement.webp',
            'gestion de projet' => 'gestion-projets.webp',
            'communication professionnelle' => 'leadership-rh.webp',
            'anglais professionnel' => 'community-management.webp',
        ];
    }

    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $this->info($dryRun ? '🔍 MODE DRY-RUN' : '🚀 Exécution');

        $report = [
            'ok' => [],
            'fixed' => [],
            'missing' => [],
            'created' => [],
        ];

        // 1) Corriger les chemins existants (.jpg -> .webp)
        $images = Image::where('imageable_type', 'FORMATION')->whereNull('deleted_at')->get();
        foreach ($images as $img) {
            $path = $img->path;
            $full = public_path($path);
            if (file_exists($full)) {
                $report['ok'][] = [$img->id_image, $path];
                continue;
            }

            $base = preg_replace('/\.[^.]+$/', '', $path);
            $alt = $base . '.webp';
            if (file_exists(public_path($alt))) {
                $report['fixed'][] = [$img->id_image, $path, $alt];
                if (!$dryRun) {
                    $img->path = $alt;
                    $img->url = '/' . ltrim($alt, '/');
                    $img->save();
                }
                continue;
            }

            $report['missing'][] = [$img->id_image, $path];
        }

        // 2) Pour les formations sans image, tenter d'en créer via mapping
        $formations = Formation::all();
        foreach ($formations as $f) {
            $has = $f->images()->whereNull('deleted_at')->exists();
            if ($has) continue;

            $titre = strtolower($f->titre);
            $found = null;
            foreach ($this->formationImageMapping as $k => $imgFile) {
                if (str_contains($titre, $k)) {
                    $full = public_path('uploads/formations/' . $imgFile);
                    if (file_exists($full)) {
                        $found = $imgFile;
                        break;
                    }
                }
            }

            if ($found) {
                $report['created'][] = [$f->id_formation, $f->titre, $found];
                if (!$dryRun) {
                    Image::create([
                        'url' => '/uploads/formations/' . $found,
                        'path' => 'uploads/formations/' . $found,
                        'alt' => 'Image de la formation: ' . $f->titre,
                        'imageable_type' => 'FORMATION',
                        'imageable_id' => $f->id_formation,
                    ]);
                }
            } else {
                // Aucun mapping trouvé
                $report['missing'][] = [null, 'no-mapping for ' . $f->titre];
            }
        }

        // Afficher rapport
        $this->line('--- Rapport ---');
        $this->info('OK (fichiers existants): ' . count($report['ok']));
        $this->info('Fixed (updated path -> .webp): ' . count($report['fixed']));
        $this->info('Created images for formations: ' . count($report['created']));
        $this->info('Missing entries: ' . count($report['missing']));

        return Command::SUCCESS;
    }
}
