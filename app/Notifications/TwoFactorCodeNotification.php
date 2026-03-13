<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class TwoFactorCodeNotification extends Notification
{
    use Queueable;

    public string $code;

    public function __construct(string $code)
    {
        $this->code = $code;
    }

    public function via($notifiable): array
    {
        return ['mail']; // ✅ obligatoire pour envoyer par email
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Votre code de vérification')
            ->line('Bonjour ' . $notifiable->prenom . ' ' . $notifiable->nom . ',')
            ->line('Voici votre code de vérification : ' . $this->code)
            ->line('Ce code expire dans 10 minutes.')
            ->salutation('ISD AFRIK');
    }
}