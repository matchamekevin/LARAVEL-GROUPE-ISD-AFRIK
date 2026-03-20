<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UpdateFormationImagesExtension extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'images:update-extensions {--pattern= : Pattern SQL LIKE pour cibler les chemins (ex: uploads/formations/%)} {--dry-run : Afficher les changements sans les appliquer}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remplace les extensions .jpg/.jpeg par .webp pour les images de formations (colonnes url et path)';

    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $pattern = $this->option('pattern') ?: 'uploads/formations/%';
        $this->info("🔎 Recherche des images avec pattern: {$pattern} et extension .jpg/.jpeg...");

        $rows = DB::table('images')
            ->select('id_image', 'path', 'url')
            ->where(function ($q) use ($pattern) {
                // path may start without leading slash
                $q->where('path', 'like', str_replace('%', '%.jpg', $pattern))
                  ->orWhere('path', 'like', str_replace('%', '%.jpeg', $pattern))
                  ->orWhere('url', 'like', '/' . str_replace('%', '%.jpg', $pattern))
                  ->orWhere('url', 'like', '/' . str_replace('%', '%.jpeg', $pattern));
            })
            ->get();

        $count = $rows->count();
        $this->info("📊 Trouvées: {$count} lignes à examiner");

        $updated = 0;

        foreach ($rows as $row) {
            $newPath = preg_replace('/\\.jpe?g$/i', '.webp', $row->path);
            $newUrl = preg_replace('/\\.jpe?g$/i', '.webp', $row->url);

            if ($newPath === $row->path && $newUrl === $row->url) {
                continue;
            }

            $this->line("- id: {$row->id_image}  path: {$row->path} -> {$newPath}  url: {$row->url} -> {$newUrl}");

            if (!$dryRun) {
                DB::table('images')->where('id_image', $row->id_image)
                    ->update(['path' => $newPath, 'url' => $newUrl]);
                $updated++;
            }
        }

        if ($dryRun) {
            $this->info('🔍 Dry-run terminé. Aucun changement appliqué.');
            $this->info("ℹ️  Lignes qui auraient été modifiées: {$count}");
        } else {
            $this->info("✅ Modifications appliquées: {$updated}");
        }

        return Command::SUCCESS;
    }
}
