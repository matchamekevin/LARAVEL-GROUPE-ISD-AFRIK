<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;

class FormMailDispatcher
{
    public function __construct(private readonly FormMailRouteService $formMailRouteService)
    {
    }

    /**
     * @param array<int, string> $lines
     */
    public function sendText(string $formKey, string $subject, array $lines, ?string $replyToEmail = null, ?string $replyToName = null): void
    {
        $recipients = $this->formMailRouteService->recipientsFor($formKey);

        if (empty($recipients)) {
            return;
        }

        $body = trim(implode(PHP_EOL, array_filter(array_map(
            static fn ($line) => trim((string) $line),
            $lines
        ))));

        if ($body === '') {
            $body = 'Nouveau message formulaire.';
        }

        Mail::raw($body, function ($mail) use ($recipients, $subject, $replyToEmail, $replyToName): void {
            $mail->to($recipients)->subject($subject);

            $reply = strtolower(trim((string) $replyToEmail));
            if ($reply !== '' && filter_var($reply, FILTER_VALIDATE_EMAIL)) {
                $mail->replyTo($reply, $replyToName ?: null);
            }
        });
    }
}
