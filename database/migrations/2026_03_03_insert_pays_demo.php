<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Insérer un pays par défaut si non existant
        if (!DB::table('pays')->where('id_pays', 1)->exists()) {
            DB::table('pays')->insert([
                'id_pays' => 1,
                'nom_pays' => 'Togo',
                'code_pays' => '+228',
                'devise_locale' => 'Franc CFA',
                'langue_principale' => 'Français',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('pays')->where('id_pays', 1)->delete();
    }
};
