<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('produits') || !Schema::hasTable('categories_produits')) {
            return;
        }

        // Purge du catalogue actuel pour repartir sur les 3 offres coeur.
        DB::table('produits')->delete();
        DB::table('categories_produits')->delete();

        DB::table('categories_produits')->insert([
            [
                'nom' => 'Solutions de gestion d\'entreprise ERP, CRM, BI et workflows adaptés à votre activité',
                'slug' => 'solutions-gestion-erp-crm-bi-workflows',
                'description' => "Solutions de gestion d'entreprise ERP, CRM, BI et workflows adaptés à votre activité",
                'icone' => 'briefcase',
                'image' => null,
                'parent_id' => null,
                'ordre' => 1,
                'actif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nom' => 'Fourniture de drone et formation en pilotage de drones',
                'slug' => 'fourniture-drone-formation-pilotage',
                'description' => 'Fourniture de drone et formation en pilotage de drones',
                'icone' => 'drone',
                'image' => null,
                'parent_id' => null,
                'ordre' => 2,
                'actif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nom' => 'Ingénierie',
                'slug' => 'ingenierie',
                'description' => 'Solutions d\'ingénierie pour vos projets techniques et opérationnels',
                'icone' => 'settings',
                'image' => null,
                'parent_id' => null,
                'ordre' => 3,
                'actif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        // Pas de restoration des données supprimées.
    }
};