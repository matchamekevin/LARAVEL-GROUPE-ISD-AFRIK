<?php
$url = 'http://127.0.0.1:8000/api/auth/login';
$data = ['email' => 'matchamegnatikevin894@gmail.com', 'mot_de_passe' => 'motdep@sse2003'];
$options = [
    'http' => [
        'header'  => "Content-Type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true,
    ],
];
$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);
echo "HTTP response:\n" . ($result ?? 'no body') . "\n";
foreach ($http_response_header as $h) echo $h . "\n";
