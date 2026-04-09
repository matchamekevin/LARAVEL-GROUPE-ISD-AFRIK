<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminLoginTest extends Command
{
    protected $signature = 'admin:login-test {email} {password}';

    protected $description = 'Vérifie localement les identifiants d\'un utilisateur (contrôle mot de passe et flag admin)';

    public function handle(): int
    {
        $email = $this->argument('email');
        $password = $this->argument('password');

        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error('Utilisateur introuvable pour l\'email: ' . $email);
            return 1;
        }

        $stored = $user->mot_de_passe ?? $user->getAuthPassword();

        if (! $stored) {
            $this->error('Aucun mot de passe enregistré pour cet utilisateur.');
            return 1;
        }

        if (! Hash::check($password, $stored)) {
            $this->error('Mot de passe invalide.');
            return 1;
        }

        $this->info('Authentification réussie.');
        $this->line('ID utilisateur: ' . ($user->id ?? $user->id_utilisateur));
        $this->line('Email: ' . $user->email);
        $this->line('is_admin: ' . (($user->is_admin) ? 'oui' : 'non'));
        $this->line('role: ' . ($user->role ?? 'n/a'));

        return 0;
    }
}
