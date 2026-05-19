<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    private array $tables = [
        'categories_produits' => [
            'id_column' => 'id_categorie',
            'url_column' => 'image_url',
            'url_pattern' => '/api/categories-produits/%s/image',
            'data_column' => 'image_data',
            'mime_column' => 'image_mime',
        ],
        'projets' => [
            'id_column' => 'id',
            'url_column' => 'image_url',
            'url_pattern' => '/api/projets/%s/image',
        ],
        'home_marketing_cards' => [
            'id_column' => 'id',
            'url_column' => 'image_url',
            'url_pattern' => '/api/home/marketing-cards/%s/image',
        ],
        'home_testimonials' => [
            'id_column' => 'id',
            'url_column' => 'avatar_url',
            'url_pattern' => '/api/home/testimonials/%s/image',
        ],
        'home_collaborators' => [
            'id_column' => 'id',
            'url_column' => 'image_url',
            'url_pattern' => '/api/home/collaborators/%s/image',
        ],
        'home_partners' => [
            'id_column' => 'id',
            'url_column' => 'image_url',
            'url_pattern' => '/api/home/partners/%s/image',
        ],
        'home_geovision_sections' => [
            'id_column' => 'id',
            'url_column' => 'image_url',
            'url_pattern' => '/api/home/geovision-sections/%s/image',
        ],
    ];

    public function up(): void
    {
        $this->populateCategoryImageData();

        foreach ($this->tables as $table => $cfg) {
            $idCol = $cfg['id_column'];
            $urlCol = $cfg['url_column'];

            if (!Schema::hasColumn($table, $urlCol)) {
                continue;
            }

            $rows = DB::table($table)
                ->whereNotNull($urlCol)
                ->where($urlCol, 'not like', '%/api/%')
                ->get([$idCol, $urlCol]);

            foreach ($rows as $row) {
                $newUrl = sprintf($cfg['url_pattern'], $row->$idCol);
                DB::table($table)->where($idCol, $row->$idCol)->update([$urlCol => $newUrl]);
            }

            $updated = $rows->count();
            if ($updated > 0) {
                Log::info("[Migration] Fixé {$updated} URLs dans {$table}");
            }
        }

        $this->populateCategoryImageData();
    }

    private function populateCategoryImageData(): void
    {
        $basePath = public_path('storage/categories');
        if (!is_dir($basePath)) {
            Log::info('[Migration] Dossier storage/categories introuvable — skip population base64');
            return;
        }

        $files = glob($basePath . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE);
        if (empty($files)) {
            Log::info('[Migration] Aucun fichier image trouvé dans storage/categories — skip');
            return;
        }

        $matched = 0;
        $categories = DB::table('categories_produits')
            ->whereNotNull('image_url')
            ->whereNull('image_data')
            ->get(['id_categorie', 'image_url']);

        foreach ($categories as $cat) {
            $filename = basename((string) parse_url((string) $cat->image_url, PHP_URL_PATH));

            $found = null;
            foreach ($files as $f) {
                if (basename($f) === $filename || pathinfo($f, PATHINFO_FILENAME) === pathinfo($filename, PATHINFO_FILENAME)) {
                    $found = $f;
                    break;
                }
            }

            if ($found) {
                $binary = file_get_contents($found);
                $mime = mime_content_type($found) ?: 'image/jpeg';
                DB::table('categories_produits')
                    ->where('id_categorie', $cat->id_categorie)
                    ->update([
                        'image_data' => base64_encode($binary),
                        'image_mime' => $mime,
                    ]);
                $matched++;
            }
        }

        Log::info("[Migration] Populé {$matched}/{$categories->count()} catégories avec image_data base64");
    }

    public function down(): void
    {
    }
};
