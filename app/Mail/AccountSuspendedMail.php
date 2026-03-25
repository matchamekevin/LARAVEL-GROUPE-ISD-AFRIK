<?php

namespace App\Mail;

use App\Models\Utilisateur;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccountSuspendedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $reason;

    public function __construct(Utilisateur $user, $reason = null)
    {
        $this->user = $user;
        $this->reason = $reason;
    }

    public function build()
    {
        return $this->subject('⚠️ Votre compte a été suspendu')
                    ->view('emails.account-suspended')
                    ->with([
                        'nom' => $this->user->nom,
                        'prenom' => $this->user->prenom,
                        'reason' => $this->reason,
                    ]);
    }
}
