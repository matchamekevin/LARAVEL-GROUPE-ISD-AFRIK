<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\Hash;

class UtilisateurSeeder extends Seeder
{
    public function run(): void
    {
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
                'id_pays' => 1,
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
                'id_pays' => 1,
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
                'id_pays' => 1,
            ]
        );
    }
}