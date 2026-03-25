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
        // Seed idempotent basé sur code_pays (évite les IDs fixes).
        DB::table('pays')->updateOrInsert(
            ['code_pays' => '+228'],
            [
                'nom_pays' => 'Togo',
                'devise_locale' => 'Franc CFA',
                'langue_principale' => 'Français',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('pays','id_pays'), COALESCE((SELECT MAX(id_pays) FROM pays), 1), true)");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('pays')->where('code_pays', '+228')->delete();
    }
};
