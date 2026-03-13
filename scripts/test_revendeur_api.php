<?php
$url = 'http://127.0.0.1:8000/api/revendeur-demandes';
$data = [
    'nom_entreprise' => 'Test SARL',
    'pays' => 'Togo',
    'telephone' => '+22890000000',
    'email_professionnel' => 'test@example.com',
    'representant_nom' => 'Kevin Test',
    'motivation' => 'Nous souhaitons distribuer les solutions ISD AFRIK sur notre zone avec une equipe commerciale.',
];
$options = [
    'http' => [
        'header'  => "Content-Type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true,
    ],
];
$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
echo "BODY:\n" . ($result ?: 'no body') . "\n";
if (isset($http_response_header)) {
    echo "HEADERS:\n";
    foreach ($http_response_header as $h) {
        echo $h . "\n";
    }
}
