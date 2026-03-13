<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('produits', 'id_utilisateur')) {
            Schema::table('produits', function (Blueprint $table) {
                // Ajout de la colonne id_utilisateur
                $table->unsignedBigInteger('id_utilisateur')->nullable()->after('id_produit');

                // Clé étrangère vers la table utilisateurs
                $table->foreign('id_utilisateur')
                      ->references('id_utilisateur')
                      ->on('utilisateurs')
                      ->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('produits', 'id_utilisateur')) {
            Schema::table('produits', function (Blueprint $table) {
                $table->dropForeign(['id_utilisateur']);
                $table->dropColumn('id_utilisateur');
            });
        }
    }
};
