<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            // Ajoute la colonne two_factor_enabled avec valeur par défaut true
            $table->boolean('two_factor_enabled')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            // Supprime la colonne si on rollback
            $table->dropColumn('two_factor_enabled');
        });
    }
};