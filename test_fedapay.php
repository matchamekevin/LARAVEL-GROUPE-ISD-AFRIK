<?php
require_once __DIR__ . '/vendor/autoload.php';

echo "<h2>Test FedaPay - MODE LIVE</h2>";

// Configuration LIVE
\FedaPay\FedaPay::setApiKey('sk_live_zILwH-XJuH524LSyBMJdXQQm');
\FedaPay\FedaPay::setEnvironment('live');

try {
    echo "<p>✓ FedaPay chargé correctement</p>";
    echo "<p>✓ Mode: LIVE (Production)</p>";
    
    // Test de création de transaction RÉELLE
    $transaction = \FedaPay\Transaction::create([
        'description' => 'Test paiement production',
        'amount' => 100, // 100 XOF (montant minimal pour test)
        'currency' => ['iso' => 'XOF'],
        'callback_url' => 'https://votre-site.com/callback', // Remplacez par votre URL
        'customer' => [
            'firstname' => 'Test',
            'lastname' => 'Client',
            'email' => 'test@example.com',
            'phone_number' => [
                'number' => '+22990000000',
                'country' => 'bj'
            ]
        ]
    ]);
    
    echo "<p style='color:green;'><strong>✓ SUCCESS! Transaction créée en LIVE</strong></p>";
    echo "<p><strong>ID:</strong> " . $transaction->id . "</p>";
    echo "<p><strong>Montant:</strong> " . $transaction->amount . " XOF</p>";
    echo "<p><strong>Status:</strong> " . $transaction->status . "</p>";
    
    if (isset($transaction->token)) {
        $paymentUrl = "https://checkout.fedapay.com/" . $transaction->token;
        echo "<p><strong>URL de paiement:</strong> <a href='" . $paymentUrl . "' target='_blank'>" . $paymentUrl . "</a></p>";
    }
    
} catch (\FedaPay\Error\ApiConnection $e) {
    echo "<p style='color:red;'><strong>✗ ERREUR ApiConnection (Problème de connexion)</strong></p>";
    echo "<p>Message: " . $e->getMessage() . "</p>";
    echo "<p>Vérifiez: Internet, cURL, Firewall</p>";
    
} catch (\FedaPay\Error\InvalidRequest $e) {
    echo "<p style='color:orange;'><strong>✗ ERREUR InvalidRequest (Requête invalide)</strong></p>";
    echo "<p>Message: " . $e->getMessage() . "</p>";
    
} catch (\FedaPay\Error\Authentication $e) {
    echo "<p style='color:red;'><strong>✗ ERREUR Authentication (Clé API invalide)</strong></p>";
    echo "<p>Message: " . $e->getMessage() . "</p>";
    echo "<p>Vérifiez vos clés API dans les paramètres FedaPay</p>";
    
} catch (Exception $e) {
    echo "<p style='color:red;'><strong>✗ Autre erreur</strong></p>";
    echo "<p>Type: " . get_class($e) . "</p>";
    echo "<p>Message: " . $e->getMessage() . "</p>";
    echo "<p>Fichier: " . $e->getFile() . " (ligne " . $e->getLine() . ")</p>";
}
?>