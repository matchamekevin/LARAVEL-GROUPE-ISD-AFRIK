<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->longText('avatar_data')->nullable()->after('avatar');
            $table->string('avatar_mime', 50)->nullable()->after('avatar_data');
        });

        Schema::table('images', function (Blueprint $table) {
            $table->longText('image_data')->nullable()->after('path');
            $table->string('image_mime', 50)->nullable()->after('image_data');
        });

        Schema::table('home_marketing_cards', function (Blueprint $table) {
            $table->longText('image_data')->nullable()->after('image_path');
            $table->string('image_mime', 50)->nullable()->after('image_data');
        });

        Schema::table('home_testimonials', function (Blueprint $table) {
            $table->longText('avatar_data')->nullable()->after('avatar_path');
            $table->string('avatar_mime', 50)->nullable()->after('avatar_data');
        });

        Schema::table('home_collaborators', function (Blueprint $table) {
            $table->longText('image_data')->nullable()->after('image_path');
            $table->string('image_mime', 50)->nullable()->after('image_data');
        });

        Schema::table('home_partners', function (Blueprint $table) {
            $table->longText('image_data')->nullable()->after('image_path');
            $table->string('image_mime', 50)->nullable()->after('image_data');
        });

        Schema::table('home_geovision_sections', function (Blueprint $table) {
            $table->longText('image_data')->nullable()->after('image_path');
            $table->string('image_mime', 50)->nullable()->after('image_data');
        });

        Schema::table('categories_produits', function (Blueprint $table) {
            $table->longText('image_data')->nullable()->after('image_url');
            $table->string('image_mime', 50)->nullable()->after('image_data');
        });
    }

    public function down(): void
    {
        $tables = ['utilisateurs', 'images', 'home_marketing_cards', 'home_testimonials',
                   'home_collaborators', 'home_partners', 'home_geovision_sections',
                   'categories_produits'];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn(['image_data', 'image_mime', 'avatar_data', 'avatar_mime']);
            });
        }
    }
};
