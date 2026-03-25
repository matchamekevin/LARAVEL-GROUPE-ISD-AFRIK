<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->boolean('can_access_client')->default(true)->after('statut');
            $table->boolean('can_access_admin')->default(false)->after('can_access_client');
        });

        // Backfill des comptes existants: admin => accès admin activé
        DB::table('utilisateurs')
            ->where('is_admin', true)
            ->update(['can_access_admin' => true]);
    }

    public function down(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropColumn(['can_access_client', 'can_access_admin']);
        });
    }
};
