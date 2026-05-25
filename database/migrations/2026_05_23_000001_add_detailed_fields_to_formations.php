<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('formations', function (Blueprint $table) {
            if (!Schema::hasColumn('formations', 'objectifs')) {
                $table->text('objectifs')->nullable()->after('benefices');
            }
            if (!Schema::hasColumn('formations', 'prerequis')) {
                $table->text('prerequis')->nullable()->after('objectifs');
            }
            if (!Schema::hasColumn('formations', 'modules')) {
                $table->text('modules')->nullable()->after('prerequis');
            }
            if (!Schema::hasColumn('formations', 'niveau')) {
                $table->string('niveau', 100)->nullable()->after('modules');
            }
            if (!Schema::hasColumn('formations', 'cible')) {
                $table->text('cible')->nullable()->after('niveau');
            }
            if (!Schema::hasColumn('formations', 'pedagogie')) {
                $table->text('pedagogie')->nullable()->after('cible');
            }
            if (!Schema::hasColumn('formations', 'materiel')) {
                $table->text('materiel')->nullable()->after('pedagogie');
            }
            if (!Schema::hasColumn('formations', 'certification')) {
                $table->string('certification', 255)->nullable()->after('materiel');
            }
        });
    }

    public function down(): void
    {
        Schema::table('formations', function (Blueprint $table) {
            $table->dropColumn([
                'objectifs', 'prerequis', 'modules', 'niveau',
                'cible', 'pedagogie', 'materiel', 'certification',
            ]);
        });
    }
};
