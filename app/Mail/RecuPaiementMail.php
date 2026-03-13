<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Paiement;
use Barryvdh\DomPDF\Facade\Pdf;

class RecuPaiementMail extends Mailable
{
    use Queueable, SerializesModels;

    public $paiement;

    public function __construct(Paiement $paiement)
    {
        $this->paiement = $paiement;
    }

    public function build()
    {
        // Générer le PDF
        $pdf = Pdf::loadView('recu-paiement', ['paiement' => $this->paiement]);

        return $this->subject('Votre reçu de paiement')
                    ->view('emails.recu-paiement') // Vue HTML simple pour le corps du mail
                    ->attachData($pdf->output(), 'recu-paiement-'.$this->paiement->id_paiement.'.pdf', [
                        'mime' => 'application/pdf',
                    ]);
    }
}