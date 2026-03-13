<?php

// app/Notifications/BienvenueNotification.php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BienvenueNotification extends Notification
{
    use Queueable;

    public function via($notifiable)
    {
        return ['database']; // on stocke en DB
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => 'Bienvenue sur ISD AFRIK !',
            'type' => 'info',
        ];
    }
}
