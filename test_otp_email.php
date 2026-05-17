<?php
require 'bootstrap/app.php';

$kernel = app(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Utilisateur;

$user = Utilisateur::where('email', 'test.2fa@test.com')->first();

if (!$user) {
    echo "❌ Utilisateur non trouvé\n";
    exit(1);
}

echo "✅ Utilisateur trouvé: {$user->email}\n";

// Activer 2FA et générer code
$user->two_factor_enabled = true;
$user->two_factor_code = str_pad(random_int(0, 999999), 6, '0', 0);
$user->two_factor_expires_at = now()->addMinutes(10);
$user->save();

echo "✅ 2FA activé\n";
echo "   Code OTP: {$user->two_factor_code}\n";
echo "   Expire: {$user->two_factor_expires_at}\n";

// Tester l'envoi
try {
    \Illuminate\Support\Facades\Mail::to($user->email)->send(
        new \App\Mail\TwoFactorCodeMail($user)
    );
    echo "✅ Email envoyé avec succès!\n";
} catch (\Exception $e) {
    echo "❌ Erreur email: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . "\n";
    echo "   Line: " . $e->getLine() . "\n";
}
?>

