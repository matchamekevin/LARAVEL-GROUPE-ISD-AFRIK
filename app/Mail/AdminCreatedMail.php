<?php

namespace App\Mail;

use App\Models\Utilisateur;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $admin;
    public $password;

    /**
     * Create a new message instance.
     */
    public function __construct(Utilisateur $admin, $password)
    {
        $this->admin = $admin;
        $this->password = $password;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Votre compte administrateur ISD AFRIK')
                    ->view('emails.admin_created');
    }
}