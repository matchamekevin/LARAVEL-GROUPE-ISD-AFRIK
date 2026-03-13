<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class CustomResetPasswordNotification extends Notification
{
    public $token;
    public $url;

    public function __construct($token, $url)
    {
        $this->token = $token;
        $this->url = $url;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Réinitialisation du mot de passe')
            ->line('Vous recevez ce message car vous avez demandé une réinitialisation de mot de passe.')
            ->action('Réinitialiser le mot de passe', $this->url)
            ->line('Si vous n’avez pas demandé de réinitialisation, ignorez ce message.');
    }
}