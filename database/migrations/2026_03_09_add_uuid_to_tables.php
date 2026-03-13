<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Migration progressive UUID : ajoute uuid aux tables principales
     * Sans supprimer id existant (migration douce)
     */
    public function up(): void
    {
        $tables = ['produits', 'utilisateurs', 'formations', 'commandes', 'paiements', 'categorie_produits'];
        
        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'uuid')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->uuid('uuid')->unique()->nullable()->after('id');
                });
                
                // Remplir les UUIDs existants 
                DB::table($table)->whereNull('uuid')->update([
                    'uuid' => DB::raw("gen_random_uuid()")
                ]);
                
                // Rendre non-nullable une fois rempli
                Schema::table($table, function (Blueprint $table) {
                    $table->uuid('uuid')->change();
                });
            }
        }
    }

    public function down(): void
    {
        $tables = ['produits', 'utilisateurs', 'formations', 'commandes', 'paiements', 'categorie_produits'];
        
        foreach ($tables as $table) {
            if (Schema::hasColumn($table, 'uuid')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropUnique(['uuid']);
                    $table->dropColumn('uuid');
                });
            }
        }
    }
};
