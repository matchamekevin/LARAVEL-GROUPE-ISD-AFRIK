<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Utilisateur;
use Illuminate\Support\Facades\Hash;

$email = 'matchamegnatikevin894@gmail.com';
$user = Utilisateur::where('email', $email)->first();
if (!$user) {
    echo "missing\n";
    exit(1);
}
$hash = $user->mot_de_passe;
echo "hash: $hash\n";
echo Hash::check('motdep@sse2003', $hash) ? "match\n" : "mismatch\n";
