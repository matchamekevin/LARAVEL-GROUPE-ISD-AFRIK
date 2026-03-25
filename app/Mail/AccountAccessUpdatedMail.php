<?php

namespace App\Mail;

use App\Models\Utilisateur;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccountAccessUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Utilisateur $user;
    public array $details;

    public function __construct(Utilisateur $user, array $details)
    {
        $this->user = $user;
        $this->details = $details;
    }

    public function build()
    {
        return $this
            ->subject('Mise à jour de vos accès ISD AFRIK')
            ->view('emails.account-access-updated');
    }
}
