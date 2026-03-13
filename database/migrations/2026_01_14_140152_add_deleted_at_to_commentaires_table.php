<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasColumn('commentaires', 'deleted_at')) {
            Schema::table('commentaires', function (Blueprint $table) {
                $table->softDeletes(); // ajoute deleted_at
            });
        }
    }

    public function down(): void {
        if (Schema::hasColumn('commentaires', 'deleted_at')) {
            Schema::table('commentaires', function (Blueprint $table) {
                $table->dropColumn('deleted_at');
            });
        }
    }
};
