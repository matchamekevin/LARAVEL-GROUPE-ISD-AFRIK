<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('categories_produits', function (Blueprint $table) {
            if (!Schema::hasColumn('categories_produits', 'segment')) {
                $table->string('segment', 100)->nullable()->index();
            }
            if (!Schema::hasColumn('categories_produits', 'image_url')) {
                $table->string('image_url', 255)->nullable();
            }
        });

        // Backfill segment/image_url for Geovision categories based on image path
        DB::table('categories_produits')
            ->where('image', 'like', '%geovision%')
            ->update([
                'segment' => 'geovision',
                'image_url' => DB::raw('image'),
            ]);
    }

    public function down(): void
    {
        Schema::table('categories_produits', function (Blueprint $table) {
            if (Schema::hasColumn('categories_produits', 'image_url')) {
                $table->dropColumn('image_url');
            }
            if (Schema::hasColumn('categories_produits', 'segment')) {
                $table->dropColumn('segment');
            }
        });
    }
};
