<?php

namespace App\Mail;

use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mime\Email;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\Mailer\Exception\TransportException;
use Illuminate\Support\Facades\Log;

class BrevoTransport extends AbstractTransport
{
    protected string $apiKey;
    protected HttpClientInterface $client;

    public function __construct(string $apiKey, HttpClientInterface $client)
    {
        parent::__construct();

        $this->apiKey = trim($apiKey, " \t\n\r\0\x0B\"'");
        $this->client = $client;
    }

    protected function doSend(SentMessage $message): void
    {
        $email = $message->getOriginalMessage();

        if (! $email instanceof Email) {
            throw new TransportException('Unsupported message type for BrevoTransport.');
        }

        $from = $email->getFrom()[0] ?? null;

        $payload = [
            'sender' => [
                'name' => $from?->getName() ?? config('mail.from.name'),
                'email' => $from?->getAddress() ?? config('mail.from.address'),
            ],
            'to' => [],
            'subject' => $email->getSubject(),
            'htmlContent' => (string) $email->getHtmlBody() ?: null,
            'textContent' => (string) $email->getTextBody() ?: null,
        ];

        foreach ($email->getTo() ?? [] as $addr) {
            $payload['to'][] = [
                'email' => $addr->getAddress(),
                'name' => $addr->getName() ?: $addr->getAddress(),
            ];
        }

        foreach ($email->getCc() ?? [] as $addr) {
            $payload['cc'][] = [
                'email' => $addr->getAddress(),
                'name' => $addr->getName() ?: $addr->getAddress(),
            ];
        }

        foreach ($email->getBcc() ?? [] as $addr) {
            $payload['bcc'][] = [
                'email' => $addr->getAddress(),
                'name' => $addr->getName() ?: $addr->getAddress(),
            ];
        }

        // Attachments
        $attachments = [];
        foreach ($email->getAttachments() as $attachment) {
            $filename = method_exists($attachment, 'getFilename') ? $attachment->getFilename() : null;
            $body = method_exists($attachment, 'getBody') ? $attachment->getBody() : null;
            if ($body !== null) {
                $attachments[] = [
                    'name' => $filename ?? 'attachment',
                    'content' => base64_encode($body),
                ];
            }
        }

        if (! empty($attachments)) {
            $payload['attachment'] = $attachments;
        }

        $response = $this->client->request('POST', 'https://api.brevo.com/v3/smtp/email', [
            'headers' => [
                'api-key' => $this->apiKey,
                'accept' => 'application/json',
                'content-type' => 'application/json',
            ],
            'json' => $payload,
        ]);

        $status = $response->getStatusCode();
        $body = $response->getContent(false);
        if ($status >= 400) {
            Log::error('Brevo API error: '.$body);
            throw new TransportException('Brevo API error: '.$body);
        }

        // Log success response (contains messageId when accepted)
        Log::info('Brevo API success: '.$body);
    }

    public function __toString(): string
    {
        return 'brevo://api';
    }
}
