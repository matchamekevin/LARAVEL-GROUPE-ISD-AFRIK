<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('devis_prestations')) {
            return;
        }

        if (! Schema::hasColumn('devis_prestations', 'deliverables')) {
            Schema::table('devis_prestations', function (Blueprint $table): void {
                $table->json('deliverables')->nullable()->after('technologies');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('devis_prestations') || ! Schema::hasColumn('devis_prestations', 'deliverables')) {
            return;
        }

        Schema::table('devis_prestations', function (Blueprint $table): void {
            $table->dropColumn('deliverables');
        });
    }
};
