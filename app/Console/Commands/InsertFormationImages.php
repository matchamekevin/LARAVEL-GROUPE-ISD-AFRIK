<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Formation;
use App\Models\Image;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class InsertFormationImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'formations:insert-images {--dry-run : Afficher les actions sans les exécuter}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Insérer les images des formations depuis le dossier uploads/formations dans la base de données';

    /**
     * Mapping des formations vers leurs images
     */
    protected $formationImageMapping = [
        'drone' => 'drone.jpeg',
        'big data' => 'big-data.jpg',
        'coaching commercial' => 'coaching-commercial.jpg',
        'community management' => 'community-management.jpg',
        'comptabilité gestion projets' => 'comptabilite-gestion-projets.jpg',
        'comptabilité immobilisations' => 'comptabilite-immobilisations.jpg',
        'conception site web' => 'conception-site-web.jpg',
        'développement api' => 'dev-application-api.jpg',
        'développement débutant' => 'dev-application-debutant.jpg',
        'excel avancé' => 'excel-avance.jpg',
        'excel pro' => 'excel-pro.jpg',
        'gestion commerciale stock' => 'gestion-commerciale-stock.jpg',
        'gestion entreprise' => 'gestion-entreprise.jpg',
        'gestion projets' => 'gestion-projets.jpg',
        'gpec' => 'gpec.jpg',
        'hôtellerie' => 'hotellerie-restauration.jpg',
        'restauration' => 'hotellerie-restauration.jpg',
        'ia organisation commerciale' => 'ia-organisation-commerciale.jpg',
        'ia performance avancé' => 'ia-performance-avance.jpg',
        'ia performance commerciale' => 'ia-performance-commerciale.jpg',
        'infographie' => 'infographie.jpg',
        'leadership rh avancé' => 'leadership-rh-avance.jpg',
        'leadership rh' => 'leadership-rh.jpg',
        'management ia avancé' => 'management-ia-avance.jpg',
        'management ia' => 'management-ia.jpg',
        'microsoft avancé' => 'microsoft-avance.jpg',
        'modernisation rh' => 'modernisation-rh.jpg',
        'motivation équipe commerciale' => 'motivation-equipe-commerciale.jpg',
        'motivation équipes' => 'motivation-equipes.jpg',
        'multimedia' => 'multimedia.jpg',
        'négociation vente' => 'negociation-vente.jpg',
        'paie ressources humaines' => 'paie-ressources-humaines.jpg',
        'paie rh logiciel' => 'paie-rh-logiciel.jpg',
        'paie rh' => 'paie-rh.jpg',
        'power point' => 'power point.jpg',
        'relance commerciale' => 'relance-commerciale.jpg',
        'relance hôtellerie' => 'relance-hotellerie.jpg',
        'relance marché' => 'relance-marche.jpg',
        'réseaux sociaux entreprise' => 'reseaux-sociaux-entreprise.jpg',
        'rh ia' => 'rh-ia.jpg',
        'secretariat moderne' => 'secretariat-moderne.jpg',
        'seo' => 'seo-referencement.jpg',
        'référencement' => 'seo-referencement.jpg',
        'syscohada avancé' => 'syscohada-avance.jpg',
        'syscohada comptabilité' => 'syscohada-comptabilite.jpg',
        'syscohada révisé' => 'syscohada-revise.jpg',
        'télémarketing' => 'telemarketing.jpg',
        'ventes ia avancé' => 'ventes-ia-avance.jpg',
        'ventes ia' => 'ventes-ia.jpg',
        'vidéo surveillance' => 'video-surveillance.jpg',
        'web wordpress' => 'web-wordpress.jpg',
        'assistant direction' => 'assistant-direction.jpg',
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

        $this->info('🚀 Démarrage de l\'insertion des images de formation...');

        // Récupérer toutes les formations
        $formations = Formation::all();
        $this->info("📊 {$formations->count()} formations trouvées");

        $inserted = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($formations as $formation) {
            try {
                $imageFile = $this->findImageForFormation($formation);

                if (!$imageFile) {
                    $this->warn("⚠️  Aucune image trouvée pour la formation: {$formation->titre}");
                    $skipped++;
                    continue;
                }

                // Vérifier si l'image existe déjà pour cette formation
                $existingImage = Image::where('imageable_type', 'FORMATION')
                    ->where('imageable_id', $formation->id_formation)
                    ->first();

                if ($existingImage) {
                    $this->warn("⏭️  Image déjà existante pour: {$formation->titre}");
                    $skipped++;
                    continue;
                }

                $imagePath = "uploads/formations/{$imageFile}";
                $imageUrl = "/{$imagePath}";

                if (!$dryRun) {
                    // Insérer l'image dans la base de données
                    Image::create([
                        'url' => $imageUrl,
                        'path' => $imagePath,
                        'alt' => "Image de la formation: {$formation->titre}",
                        'imageable_type' => 'FORMATION',
                        'imageable_id' => $formation->id_formation,
                    ]);
                }

                $this->info("✅ Image insérée pour: {$formation->titre} -> {$imageFile}");
                $inserted++;

            } catch (\Exception $e) {
                $this->error("❌ Erreur pour {$formation->titre}: {$e->getMessage()}");
                $errors++;
            }
        }

        $this->info("📈 Résumé:");
        $this->info("   ✅ Insérées: {$inserted}");
        $this->info("   ⏭️  Ignorées: {$skipped}");
        $this->info("   ❌ Erreurs: {$errors}");

        if ($dryRun) {
            $this->info('🔍 Mode dry-run terminé. Utilisez sans --dry-run pour appliquer les changements.');
        } else {
            $this->info('🎉 Insertion des images terminée !');
        }

        return Command::SUCCESS;
    }

    /**
     * Trouver l'image correspondante pour une formation
     */
    protected function findImageForFormation(Formation $formation): ?string
    {
        $titre = strtolower($formation->titre);

        // Recherche exacte d'abord
        foreach ($this->formationImageMapping as $key => $image) {
            if (str_contains($titre, $key)) {
                // Vérifier que le fichier existe
                $fullPath = public_path("uploads/formations/{$image}");
                if (file_exists($fullPath)) {
                    return $image;
                }
            }
        }

        // Si aucune correspondance trouvée, utiliser une image par défaut
        $defaultImages = [
            'drone.jpeg',
            'big-data.jpg',
            'coaching-commercial.jpg',
            'community-management.jpg'
        ];

        // Utiliser l'ID de formation pour une rotation déterministe
        $defaultImage = $defaultImages[$formation->id_formation % count($defaultImages)];
        $fullPath = public_path("uploads/formations/{$defaultImage}");

        return file_exists($fullPath) ? $defaultImage : null;
    }
}