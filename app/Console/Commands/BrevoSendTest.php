<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BrevoMailer;

class BrevoSendTest extends Command
{
    protected $signature = 'brevo:send-test {recipient?}';

    protected $description = 'Envoie un email de test via l\'API Brevo';

    public function handle(BrevoMailer $brevoMailer)
    {
        $recipient = $this->argument('recipient') ?? env('TEST_BREVO_RECIPIENT');

        if (empty($recipient)) {
            $this->error('Aucun destinataire spécifié (argument ou TEST_BREVO_RECIPIENT).');
            return 1;
        }

        $subject = 'Test Brevo - ' . config('app.name');
        $html = '<p>Ceci est un email de test envoyé via l\'API Brevo.</p>';

        try {
            $result = $brevoMailer->send($recipient, $subject, $html);
            $this->info('Email envoyé, réponse API: ' . json_encode($result));
            return 0;
        } catch (\Throwable $e) {
            $this->error('Envoi échoué: ' . $e->getMessage());
            return 1;
        }
    }
}
