<?php

namespace App\Console\Commands;

use App\Models\CategorieProduit;
use App\Models\Produit;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class AuditProductSegments extends Command
{
    protected $signature = 'catalog:segments:audit
        {--fix : Corriger automatiquement les produits incoherents}
        {--normalize-categories : Normaliser les segments de categories avant audit}
        {--limit=0 : Limiter le nombre de produits audites (0 = tous)}';

    protected $description = 'Audite la separation des produits entre segments general/geovision et corrige les incoherences.';

    /** @var array<string, Collection<int, CategorieProduit>> */
    private array $categoriesBySegment = [];

    public function handle(): int
    {
        $fix = (bool) $this->option('fix');
        $normalizeCategories = (bool) $this->option('normalize-categories');
        $limit = (int) $this->option('limit');

        if ($fix || $normalizeCategories) {
            $normalized = $this->normalizeCategorySegments();

            $this->line('Categories normalisees: ' . $normalized);
            $this->newLine();
        }

        $query = Produit::query()
            ->with(['categorie'])
            ->orderBy('id_produit');

        if ($limit > 0) {
            $query->limit($limit);
        }

        $products = $query->get();

        if ($products->isEmpty()) {
            $this->warn('Aucun produit a auditer.');
            return self::SUCCESS;
        }

        $checked = 0;
        $mismatches = 0;
        $fixed = 0;
        $unresolved = 0;
        $rows = [];

        foreach ($products as $product) {
            $checked++;

            $expectedSegment = $this->inferExpectedSegment($product);
            $currentCategory = $product->categorie;
            $currentSegment = $currentCategory?->segment;

            $hasMismatch = false;
            $reason = '';
            $before = $currentCategory?->slug ?: 'AUCUNE_CATEGORIE';
            $after = '';

            if (!$currentCategory) {
                $hasMismatch = true;
                $reason = 'categorie absente';
            } elseif (!in_array((string) $currentSegment, ['general', 'geovision'], true)) {
                $hasMismatch = true;
                $reason = 'segment categorie invalide';
            } elseif ($currentSegment !== $expectedSegment) {
                $hasMismatch = true;
                $reason = 'segment produit attendu=' . $expectedSegment;
            }

            if (!$hasMismatch) {
                continue;
            }

            $mismatches++;

            if ($fix) {
                $replacement = $this->findReplacementCategory($product, $expectedSegment, $currentCategory);

                if ($replacement) {
                    $product->id_categorie = $replacement->id_categorie;
                    $product->save();

                    $fixed++;
                    $after = $replacement->slug;
                } else {
                    $unresolved++;
                    $after = 'AUCUNE_CATEGORIE_CIBLE';
                }
            }

            if (count($rows) < 80) {
                $rows[] = [
                    (string) ($product->id_produit ?? '-'),
                    Str::limit((string) ($product->slug ?: $product->titre), 45),
                    (string) $expectedSegment,
                    (string) ($currentSegment ?: 'null'),
                    Str::limit($before, 28),
                    Str::limit($after ?: '-', 28),
                    $reason,
                ];
            }
        }

        if (!empty($rows)) {
            $this->table(
                ['ID', 'Produit', 'Attendu', 'Actuel', 'Categorie actuelle', 'Categorie cible', 'Raison'],
                $rows
            );
        }

        $this->newLine();
        $this->info('Audit termine.');
        $this->line("Produits verifies: {$checked}");
        $this->line("Incoherences: {$mismatches}");
        $this->line("Corriges: {$fixed}");
        $this->line("Non resolus: {$unresolved}");

        if ($mismatches > 0 && !$fix) {
            $this->warn('Des incoherences existent. Relancer avec --fix pour corriger.');
            return self::FAILURE;
        }

        if ($unresolved > 0) {
            $this->warn('Certaines incoherences restent non resolues automatiquement.');
            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    private function normalizeCategorySegments(): int
    {
        $updated = 0;

        CategorieProduit::query()
            ->orderBy('id_categorie')
            ->chunkById(250, function (Collection $categories) use (&$updated) {
                foreach ($categories as $category) {
                    $targetSegment = $this->inferExpectedCategorySegment($category);

                    if ($category->segment === $targetSegment) {
                        continue;
                    }

                    $category->segment = $targetSegment;
                    $category->save();
                    $updated++;
                }
            }, 'id_categorie', 'id_categorie');

        $this->categoriesBySegment = [];

        return $updated;
    }

    private function inferExpectedCategorySegment(CategorieProduit $category): string
    {
        $current = Str::lower(trim((string) ($category->segment ?? '')));

        if (in_array($current, ['general', 'geovision'], true)) {
            return $current;
        }

        $slug = Str::lower((string) ($category->slug ?? ''));

        if (Str::startsWith($slug, 'geovision-') || $current === 'geovision-camera') {
            return 'geovision';
        }

        return 'general';
    }

    private function inferExpectedSegment(Produit $product): string
    {
        $reference = strtoupper((string) ($product->reference ?? ''));
        $slug = strtolower((string) ($product->slug ?? ''));
        $brand = strtolower((string) ($product->marque ?? ''));
        $title = strtolower((string) ($product->titre ?? ''));
        $model = strtolower((string) ($product->modele ?? ''));

        if (Str::startsWith($slug, 'geovision-')) {
            return 'geovision';
        }

        if (Str::contains($brand, 'geovision') || Str::contains($title, 'geovision')) {
            return 'geovision';
        }

        if (Str::startsWith($reference, ['GV-', 'UVS-'])) {
            return 'geovision';
        }

        if (Str::contains($model, ['gv-', 'uvs-'])) {
            return 'geovision';
        }

        return 'general';
    }

    private function getCategoriesBySegment(string $segment): Collection
    {
        if (isset($this->categoriesBySegment[$segment])) {
            return $this->categoriesBySegment[$segment];
        }

        $categories = CategorieProduit::query()
            ->where('segment', $segment)
            ->orderByRaw('COALESCE(ordre, 999999) asc')
            ->orderBy('nom')
            ->get();

        return $this->categoriesBySegment[$segment] = $categories;
    }

    private function findReplacementCategory(Produit $product, string $expectedSegment, ?CategorieProduit $currentCategory): ?CategorieProduit
    {
        $categories = $this->getCategoriesBySegment($expectedSegment);

        if ($categories->isEmpty()) {
            return null;
        }

        if ($currentCategory) {
            $sameSlug = $categories->first(fn (CategorieProduit $item) => $item->slug === $currentCategory->slug);
            if ($sameSlug) {
                return $sameSlug;
            }

            $sameName = $categories->first(function (CategorieProduit $item) use ($currentCategory) {
                return Str::lower((string) $item->nom) === Str::lower((string) $currentCategory->nom);
            });

            if ($sameName) {
                return $sameName;
            }
        }

        if ($expectedSegment === 'geovision') {
            $title = Str::lower((string) ($product->titre ?? ''));
            $reference = Str::lower((string) ($product->reference ?? ''));
            $model = Str::lower((string) ($product->modele ?? ''));
            $haystack = $title . ' ' . $reference . ' ' . $model;

            $rootSlug = null;

            if (Str::contains($haystack, ['camera', 'dome', 'bullet', 'ptz', 'fisheye', 'thermal'])) {
                $rootSlug = 'geovision-cameras';
            } elseif (Str::contains($haystack, ['nvr', 'dvr', 'xvr', 'snvr', 'recording'])) {
                $rootSlug = 'geovision-enregistreurs-nvr';
            } elseif (Str::contains($haystack, ['access', 'badge', 'biometr', 'reader', 'intercom'])) {
                $rootSlug = 'geovision-controle-acces';
            } elseif (Str::contains($haystack, ['vms', 'analytics', 'control center', 'cloud'])) {
                $rootSlug = 'geovision-vms-analytics';
            } elseif (Str::contains($haystack, ['lpr', 'anpr', 'plate', 'parking', 'barrier'])) {
                $rootSlug = 'geovision-lpr-anpr';
            } elseif (Str::contains($haystack, ['poe', 'switch', 'network', 'reseau'])) {
                $rootSlug = 'geovision-poe-reseau';
            }

            if ($rootSlug) {
                $rootCategory = $categories->first(fn (CategorieProduit $item) => $item->slug === $rootSlug);
                if ($rootCategory) {
                    return $rootCategory;
                }
            }
        }

        $root = $categories->first(fn (CategorieProduit $item) => empty($item->parent_id));
        return $root ?: $categories->first();
    }
}
