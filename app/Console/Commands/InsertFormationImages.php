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
        'drone' => 'drone.webp',
        'big data' => 'big-data.webp',
        'coaching commercial' => 'coaching-commercial.webp',
        'community management' => 'community-management.webp',
        'comptabilité gestion projets' => 'comptabilite-gestion-projets.webp',
        'comptabilité immobilisations' => 'comptabilite-immobilisations.webp',
        'conception site web' => 'conception-site-web.webp',
        'développement api' => 'dev-application-api.webp',
        'développement débutant' => 'dev-application-debutant.webp',
        'excel avancé' => 'excel-avance.webp',
        'excel pro' => 'excel-pro.webp',
        'gestion commerciale stock' => 'gestion-commerciale-stock.webp',
        'gestion entreprise' => 'gestion-entreprise.webp',
        'gestion projets' => 'gestion-projets.webp',
        'gpec' => 'gpec.webp',
        'hôtellerie' => 'hotellerie-restauration.webp',
        'restauration' => 'hotellerie-restauration.webp',
        'ia organisation commerciale' => 'ia-organisation-commerciale.webp',
        'ia performance avancé' => 'ia-performance-avance.webp',
        'ia performance commerciale' => 'ia-performance-commerciale.webp',
        'infographie' => 'infographie.webp',
        'leadership rh avancé' => 'leadership-rh-avance.webp',
        'leadership rh' => 'leadership-rh.webp',
        'management ia avancé' => 'management-ia-avance.webp',
        'management ia' => 'management-ia.webp',
        'microsoft avancé' => 'microsoft-avance.webp',
        'modernisation rh' => 'modernisation-rh.webp',
        'motivation équipe commerciale' => 'motivation-equipe-commerciale.webp',
        'motivation équipes' => 'motivation-equipes.webp',
        'multimedia' => 'multimedia.webp',
        'négociation vente' => 'negociation-vente.webp',
        'paie ressources humaines' => 'paie-ressources-humaines.webp',
        'paie rh logiciel' => 'paie-rh-logiciel.webp',
        'paie rh' => 'paie-rh.webp',
        'power point' => 'power point.webp',
        'relance commerciale' => 'relance-commerciale.webp',
        'relance hôtellerie' => 'relance-hotellerie.webp',
        'relance marché' => 'relance-marche.webp',
        'réseaux sociaux entreprise' => 'reseaux-sociaux-entreprise.webp',
        'rh ia' => 'rh-ia.webp',
        'secretariat moderne' => 'secretariat-moderne.webp',
        'seo' => 'seo-referencement.webp',
        'référencement' => 'seo-referencement.webp',
        'syscohada avancé' => 'syscohada-avance.webp',
        'syscohada comptabilité' => 'syscohada-comptabilite.webp',
        'syscohada révisé' => 'syscohada-revise.webp',
        'télémarketing' => 'telemarketing.webp',
        'ventes ia avancé' => 'ventes-ia-avance.webp',
        'ventes ia' => 'ventes-ia.webp',
        'vidéo surveillance' => 'video-surveillance.webp',
        'web wordpress' => 'web-wordpress.webp',
        'assistant direction' => 'assistant-direction.webp',
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

        // Aucun fallback: si aucune correspondance trouvée, ne pas assigner d'image par défaut
        return null;
    }
}