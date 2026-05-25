<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('formations', function (Blueprint $table) {
            $table->dropUnique('formations_titre_unique');
            $table->unique(['titre', 'categorie'], 'formations_titre_categorie_unique');
        });
    }

    public function down(): void
    {
        Schema::table('formations', function (Blueprint $table) {
            $table->dropUnique('formations_titre_categorie_unique');
            $table->unique('titre', 'formations_titre_unique');
        });
    }
};
