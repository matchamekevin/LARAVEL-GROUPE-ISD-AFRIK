<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BrevoMailer
{
    protected string $apiKey;
    protected ?string $senderEmail;
    protected ?string $senderName;

    public function __construct()
    {
        $this->apiKey = config('services.brevo.key') ?? env('BREVO_API_KEY');
        $this->senderEmail = config('services.brevo.sender.email') ?? env('BREVO_SENDER_EMAIL');
        $this->senderName = config('services.brevo.sender.name') ?? env('BREVO_SENDER_NAME');
    }

    /**
     * Send an email via Brevo API (POST /v3/smtp/email).
     *
     * @param string|array $to
     * @param string $subject
     * @param string $htmlContent
     * @param string|null $textContent
     * @param array $cc
     * @param array $bcc
     * @param array $attachments
     * @return array
     */
    public function send(string|array $to, string $subject, string $htmlContent, ?string $textContent = null, array $cc = [], array $bcc = [], array $attachments = []): array
    {
        $payload = [
            'sender' => [
                'name' => $this->senderName ?? config('app.name'),
                'email' => $this->senderEmail ?? config('mail.from.address'),
            ],
            'to' => $this->normalizeRecipients($to),
            'subject' => $subject,
            'htmlContent' => $htmlContent,
            'textContent' => $textContent ?? strip_tags($htmlContent),
        ];

        if (!empty($cc)) {
            $payload['cc'] = $this->normalizeRecipients($cc);
        }
        if (!empty($bcc)) {
            $payload['bcc'] = $this->normalizeRecipients($bcc);
        }
        if (!empty($attachments)) {
            $payload['attachment'] = $this->prepareAttachments($attachments);
        }

        $response = Http::withHeaders([
            'accept' => 'application/json',
            'api-key' => $this->apiKey,
        ])->post('https://api.brevo.com/v3/smtp/email', $payload);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('BrevoMailer send failed', ['status' => $response->status(), 'body' => $response->body()]);
        $response->throw();
    }

    protected function normalizeRecipients(string|array $recipients): array
    {
        $recipients = is_array($recipients) ? $recipients : [$recipients];
        $result = [];

        foreach ($recipients as $recipient) {
            if (is_array($recipient)) {
                if (isset($recipient['email'])) {
                    $entry = ['email' => $recipient['email']];
                    if (!empty($recipient['name'])) {
                        $entry['name'] = $recipient['name'];
                    }
                    $result[] = $entry;
                }
            } else {
                $result[] = ['email' => $recipient];
            }
        }

        return $result;
    }

    /**
     * Prepare attachments for Brevo: either provide ['path'=>...]
     * or ['name'=>..., 'content'=>raw bytes]. The API expects base64 content.
     *
     * @param array $attachments
     * @return array
     */
    protected function prepareAttachments(array $attachments): array
    {
        $result = [];

        foreach ($attachments as $attachment) {
            if (isset($attachment['path']) && file_exists($attachment['path'])) {
                $content = base64_encode(file_get_contents($attachment['path']));
                $result[] = [
                    'name' => $attachment['name'] ?? basename($attachment['path']),
                    'content' => $content,
                ];
            } elseif (isset($attachment['content']) && isset($attachment['name'])) {
                $result[] = [
                    'name' => $attachment['name'],
                    'content' => base64_encode($attachment['content']),
                ];
            }
        }

        return $result;
    }
}
