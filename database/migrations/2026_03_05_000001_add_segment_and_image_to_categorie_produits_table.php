<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('categorie_produits', function (Blueprint $table) {
            if (!Schema::hasColumn('categorie_produits', 'segment')) {
                $table->string('segment', 100)->nullable()->after('description');
            }
            if (!Schema::hasColumn('categorie_produits', 'image_url')) {
                $table->string('image_url', 255)->nullable()->after('segment');
            }
        });
    }

    public function down(): void
    {
        Schema::table('categorie_produits', function (Blueprint $table) {
            if (Schema::hasColumn('categorie_produits', 'image_url')) {
                $table->dropColumn('image_url');
            }
            if (Schema::hasColumn('categorie_produits', 'segment')) {
                $table->dropColumn('segment');
            }
        });
    }
};
