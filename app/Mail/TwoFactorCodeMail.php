<?php

namespace App\Mail;

use App\Models\Utilisateur;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TwoFactorCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public function __construct(Utilisateur $user)
    {
        $this->user = $user;
    }

    public function build()
    {
        return $this->subject('Votre code de vérification')
                    ->view('emails.twofactor')
                    ->with([
                        'code' => $this->user->two_factor_code,
                        'nom'  => $this->user->nom,
                    ]);
    }
}