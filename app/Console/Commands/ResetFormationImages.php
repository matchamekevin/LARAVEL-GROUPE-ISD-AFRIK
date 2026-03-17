<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Formation;
use App\Models\Image;
use Illuminate\Support\Facades\DB;

class ResetFormationImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'formations:reset-images {--dry-run : Afficher les actions sans les exécuter}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Supprimer toutes les images actuelles des formations et en insérer de nouvelles depuis uploads/formations';

    /**
     * Mapping amélioré des formations vers leurs images
     */
    protected $formationImageMapping = [
        // Étudiants - formations académiques
        'gestion commerciale et stock' => 'gestion-commerciale-stock.jpg',
        'comptabilité générale' => 'comptabilite-gestion-projets.jpg',
        'microsoft excel avancé' => 'excel-avance.jpg',
        'videosurveillance' => 'video-surveillance.jpg',
        'drones' => 'assistant-direction.jpg', // image disponible la plus proche
        'extincteurs' => 'gestion-entreprise.jpg', // image sécurité

        // Particuliers - formations professionnelles
        'transformation digitale' => 'big-data.jpg',
        'solutions cloud' => 'dev-application-api.jpg',
        'web mobile' => 'web-wordpress.jpg',
        'marketing digital' => 'seo-referencement.jpg',
        'gestion de projet' => 'gestion-projets.jpg',
        'communication professionnelle' => 'leadership-rh.jpg',
        'anglais professionnel' => 'community-management.jpg',

        // Entreprises - formations business
        'ressources humaines' => 'leadership-rh.jpg',
        'comptabilité' => 'comptabilite-immobilisations.jpg',
        'gestion' => 'gestion-entreprise.jpg',
        'informatique' => 'dev-application-debutant.jpg',
        'commerce' => 'coaching-commercial.jpg',
        'finance' => 'paie-rh.jpg',
        'droit' => 'syscohada-comptabilite.jpg',
        'marketing' => 'community-management.jpg',
        'communication' => 'multimedia.jpg',
        'qualité' => 'gpec.jpg',
        'sécurité' => 'video-surveillance.jpg',
        'environnement' => 'gestion-entreprise.jpg',
        'logistique' => 'gestion-commerciale-stock.jpg',
        'transport' => 'hotellerie-restauration.jpg',
        'tourisme' => 'hotellerie-restauration.jpg',
        'immobilier' => 'comptabilite-immobilisations.jpg',
        'agriculture' => 'gestion-entreprise.jpg',
        'industrie' => 'gestion-entreprise.jpg',
        'artisanat' => 'multimedia.jpg',
        'services' => 'leadership-rh.jpg',
    ];

    /**
     * Images par défaut pour les formations non mappées
     */
    protected $defaultImages = [
        'big-data.jpg',
        'coaching-commercial.jpg',
        'community-management.jpg',
        'gestion-projets.jpg',
        'leadership-rh.jpg',
        'gestion-entreprise.jpg',
        'dev-application-api.jpg',
        'seo-referencement.jpg',
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('🔍 MODE DRY-RUN: Aucune modification ne sera effectuée');
        }

        $this->info('🗑️  Suppression des images actuelles des formations...');

        // Compter les images actuelles
        $currentImagesCount = Image::where('imageable_type', 'FORMATION')->count();
        $this->info("📊 {$currentImagesCount} images de formations trouvées");

        if (!$dryRun) {
            // Supprimer toutes les images des formations
            Image::where('imageable_type', 'FORMATION')->delete();
            $this->info('✅ Images supprimées');
        }

        $this->info('🚀 Insertion des nouvelles images...');

        // Récupérer toutes les formations
        $formations = Formation::all();
        $this->info("📊 {$formations->count()} formations à traiter");

        $inserted = 0;
        $skipped = 0;

        foreach ($formations as $formation) {
            $imageFile = $this->findImageForFormation($formation);

            if (!$imageFile) {
                $this->warn("⚠️  Aucune image trouvée pour: {$formation->titre}");
                $skipped++;
                continue;
            }

            if (!$dryRun) {
                // Insérer la nouvelle image
                Image::create([
                    'url' => "/uploads/formations/{$imageFile}",
                    'path' => "uploads/formations/{$imageFile}",
                    'alt' => "Image de la formation: {$formation->titre}",
                    'imageable_type' => 'FORMATION',
                    'imageable_id' => $formation->id_formation,
                ]);
            }

            $this->info("✅ Image assignée: {$formation->titre} -> {$imageFile}");
            $inserted++;
        }

        $this->info("📈 Résumé:");
        $this->info("   🗑️  Supprimées: {$currentImagesCount}");
        $this->info("   ✅ Insérées: {$inserted}");
        $this->info("   ⚠️  Ignorées: {$skipped}");

        if ($dryRun) {
            $this->info('🔍 Mode dry-run terminé. Utilisez sans --dry-run pour appliquer les changements.');
        } else {
            $this->info('🎉 Réinitialisation des images terminée !');
        }

        return Command::SUCCESS;
    }

    /**
     * Trouver l'image appropriée pour une formation
     */
    protected function findImageForFormation(Formation $formation): ?string
    {
        $titre = strtolower($formation->titre);

        // Recherche par mots-clés dans le titre
        foreach ($this->formationImageMapping as $keyword => $image) {
            if (str_contains($titre, $keyword)) {
                // Vérifier que le fichier existe
                $fullPath = public_path("uploads/formations/{$image}");
                if (file_exists($fullPath)) {
                    return $image;
                }
            }
        }

        // Image par défaut basée sur l'ID de formation
        $defaultImage = $this->defaultImages[$formation->id_formation % count($this->defaultImages)];
        $fullPath = public_path("uploads/formations/{$defaultImage}");

        return file_exists($fullPath) ? $defaultImage : null;
    }
}