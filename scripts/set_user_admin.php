<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Utilisateur;

$email = 'matchamegnatikevin894@gmail.com';

$user = Utilisateur::where('email', $email)->first();
if (!$user) {
    echo "User not found\n";
    exit(1);
}

$user->admin_role = 'superadmin';
$user->is_admin = true;
$user->can_access_admin = true;
$user->statut = 'actif';
$user->save();

echo "User updated to admin\n";