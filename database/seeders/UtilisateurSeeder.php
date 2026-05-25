<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UtilisateurSeeder extends Seeder
{
    public function run(): void
    {
        $paysId = DB::table('pays')->value('id_pays');
        if (!$paysId) {
            $paysId = (string) \Illuminate\Support\Str::uuid();
            DB::table('pays')->insert([
                'id_pays' => $paysId,
                'nom_pays' => 'Inconnu',
                'code_pays' => 'XX',
                'devise_locale' => null,
                'langue_principale' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Utilisateur::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'nom' => 'Admin',
                'prenom' => 'Test',
                'telephone' => '90000001',
                'mot_de_passe' => Hash::make('admin123'),
                'admin_role' => 'admin_adjoint',
                'is_admin' => true,
                'statut' => 'actif',
                'can_access_client' => true,
                'can_access_admin' => true,
                'date_creation' => now(),
                'id_pays' => $paysId,
            ]
        );

        Utilisateur::firstOrCreate(
            ['email' => 'client@test.com'],
            [
                'nom' => 'Client',
                'prenom' => 'Test',
                'telephone' => '90000002',
                'mot_de_passe' => Hash::make('client123'),
                'admin_role' => 'client',
                'is_admin' => false,
                'statut' => 'actif',
                'can_access_client' => true,
                'can_access_admin' => false,
                'date_creation' => now(),
                'id_pays' => $paysId,
            ]
        );

        Utilisateur::firstOrCreate(
            ['email' => 'matchamegnatikevin894@gmail.com'],
            [
                'nom' => 'Matchamegnati',
                'prenom' => 'Kevin',
                'telephone' => null,
                'mot_de_passe' => Hash::make('motdep@sse2003'),
                'admin_role' => 'superadmin',
                'is_admin' => true,
                'statut' => 'actif',
                'can_access_client' => true,
                'can_access_admin' => true,
                'date_creation' => now(),
                'id_pays' => $paysId,
            ]
        );
    }
}