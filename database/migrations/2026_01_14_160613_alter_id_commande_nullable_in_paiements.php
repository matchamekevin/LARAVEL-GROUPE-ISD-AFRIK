<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('paiements', 'id_commande')) {
            Schema::table('paiements', function (Blueprint $table) {
                // ⚡ Rendre id_commande nullable
                $table->unsignedBigInteger('id_commande')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('paiements', 'id_commande')) {
            Schema::table('paiements', function (Blueprint $table) {
                // ⚡ Revenir à NOT NULL si besoin
                $table->unsignedBigInteger('id_commande')->change();
            });
        }
    }
};