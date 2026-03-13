<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Utilisateur;
use Illuminate\Support\Facades\Hash;

$email = 'matchamegnatikevin894@gmail.com';
$password = 'motdep@sse2003';

$user = Utilisateur::where('email', $email)->first();
if (!$user) {
    echo "user_missing\n";
    exit(1);
}

$user->mot_de_passe = $password; // le mutator `setMotDePasseAttribute` va hasher
$user->save();

echo "updated\n";
