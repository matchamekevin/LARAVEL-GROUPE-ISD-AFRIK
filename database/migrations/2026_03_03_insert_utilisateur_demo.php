<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Insérer un utilisateur admin par défaut si non existant
        if (!DB::table('utilisateurs')->where('id_utilisateur', 1)->exists()) {
            DB::table('utilisateurs')->insert([
                'id_utilisateur' => 1,
                'nom' => 'Admin',
                'prenom' => 'Test',
                'email' => 'admin@test.com',
                'telephone' => '90000001',
                'mot_de_passe' => Hash::make('admin123'),
                'role' => 'admin',
                'is_admin' => true,
                'statut' => 'actif',
                'date_creation' => now(),
                'id_pays' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('utilisateurs')->where('id_utilisateur', 1)->delete();
    }
};
