<?php

namespace App\Mail;

use App\Models\Utilisateur;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccountReactivatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public function __construct(Utilisateur $user)
    {
        $this->user = $user;
    }

    public function build()
    {
        return $this->subject('✅ Votre compte a été réactivé')
                    ->view('emails.account-reactivated')
                    ->with([
                        'nom' => $this->user->nom,
                        'prenom' => $this->user->prenom,
                    ]);
    }
}
