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
        'gestion commerciale et stock' => 'gestion-commerciale-stock.webp',
        'comptabilité générale' => 'comptabilite-gestion-projets.webp',
        'microsoft excel avancé' => 'excel-avance.webp',
        'videosurveillance' => 'video-surveillance.webp',
        'drones' => 'assistant-direction.webp', // image disponible la plus proche
        'extincteurs' => 'gestion-entreprise.webp', // image sécurité

        // Particuliers - formations professionnelles
        'transformation digitale' => 'big-data.webp',
        'solutions cloud' => 'dev-application-api.webp',
        'web & mobile' => 'web-wordpress.webp',
        'web mobile' => 'web-wordpress.webp',
        'marketing digital' => 'seo-referencement.webp',
        'gestion de projet' => 'gestion-projets.webp',
        'communication professionnelle' => 'leadership-rh.webp',
        'anglais professionnel' => 'community-management.webp',

        // Entreprises - formations business
        'ressources humaines' => 'leadership-rh.webp',
        'comptabilité' => 'comptabilite-immobilisations.webp',
        'gestion' => 'gestion-entreprise.webp',
        'informatique' => 'dev-application-debutant.webp',
        'commerce' => 'coaching-commercial.webp',
        'finance' => 'paie-rh.webp',
        'droit' => 'syscohada-comptabilite.webp',
        'marketing' => 'community-management.webp',
        'communication' => 'multimedia.webp',
        'qualité' => 'gpec.webp',
        'sécurité' => 'video-surveillance.webp',
        'environnement' => 'gestion-entreprise.webp',
        'logistique' => 'gestion-commerciale-stock.webp',
        'transport' => 'hotellerie-restauration.webp',
        'tourisme' => 'hotellerie-restauration.webp',
        'immobilier' => 'comptabilite-immobilisations.webp',
        'agriculture' => 'gestion-entreprise.webp',
        'industrie' => 'gestion-entreprise.webp',
        'artisanat' => 'multimedia.webp',
        'services' => 'leadership-rh.webp',
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

        // Aucun fallback: si aucune image mappée trouvée, ne pas assigner d'image par défaut
        return null;
    }
}