<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // On vide les tokens car les IDs numériques ne sont plus valides
        DB::table('personal_access_tokens')->truncate();

        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // Changement de type pour tokenable_id (bigint -> uuid/string)
            // Dans Postgres, on doit passer par ALTER TABLE pour changer le type
            DB::statement('ALTER TABLE personal_access_tokens ALTER COLUMN tokenable_id TYPE varchar(255)');
        });
    }

    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            DB::statement('ALTER TABLE personal_access_tokens ALTER COLUMN tokenable_id TYPE bigint USING tokenable_id::bigint');
        });
    }
};
