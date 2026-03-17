<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Image;
use Illuminate\Support\Facades\DB;

class InsertCategoryImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'categories:insert-images {--dry-run : Afficher les actions sans les exécuter}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Insérer les images des catégories de formation dans la base de données';

    /**
     * Images pour chaque catégorie
     */
    protected $categoryImages = [
        'etudiant' => [
            'image' => 'gestion-projets.jpg', // Image académique/organisation
            'alt' => 'Formations pour étudiants - Préparez votre avenir professionnel'
        ],
        'particulier' => [
            'image' => 'leadership-rh.jpg', // Image développement personnel
            'alt' => 'Formations pour particuliers - Développez vos compétences'
        ],
        'entreprise' => [
            'image' => 'gestion-entreprise.jpg', // Image business/professionnelle
            'alt' => 'Formations pour entreprises - Boostez vos équipes'
        ]
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

        $this->info('🚀 Démarrage de l\'insertion des images de catégorie...');

        $inserted = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($this->categoryImages as $categoryKey => $categoryData) {
            try {
                $imagePath = "uploads/categories/{$categoryData['image']}";
                $imageUrl = "/{$imagePath}";

                // Vérifier si l'image existe déjà pour cette catégorie
                $existingImage = Image::where('imageable_type', 'CATEGORY')
                    ->where('imageable_id', $this->getCategoryId($categoryKey))
                    ->first();

                if ($existingImage) {
                    $this->warn("⏭️  Image déjà existante pour la catégorie: {$categoryKey}");
                    $skipped++;
                    continue;
                }

                // Vérifier que le fichier existe
                $fullPath = public_path($imagePath);
                if (!file_exists($fullPath)) {
                    $this->error("❌ Fichier image introuvable: {$fullPath}");
                    $errors++;
                    continue;
                }

                if (!$dryRun) {
                    // Insérer l'image dans la base de données
                    Image::create([
                        'url' => $imageUrl,
                        'path' => $imagePath,
                        'alt' => $categoryData['alt'],
                        'imageable_type' => 'CATEGORY',
                        'imageable_id' => $this->getCategoryId($categoryKey),
                    ]);
                }

                $this->info("✅ Image insérée pour: {$categoryKey} -> {$categoryData['image']}");
                $inserted++;

            } catch (\Exception $e) {
                $this->error("❌ Erreur pour {$categoryKey}: {$e->getMessage()}");
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
            $this->info('🎉 Insertion des images de catégorie terminée !');
        }

        return Command::SUCCESS;
    }

    /**
     * Obtenir l'ID numérique pour une catégorie
     */
    protected function getCategoryId(string $categoryKey): int
    {
        $categoryIds = [
            'etudiant' => 1,
            'particulier' => 2,
            'entreprise' => 3
        ];

        return $categoryIds[$categoryKey] ?? 0;
    }
}