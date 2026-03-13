<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Facture;
use App\Models\Paiement;
use Barryvdh\DomPDF\Facade\Pdf;

class FactureController extends Controller
{
    // Générer une facture après paiement validé
    public function generate($id_paiement)
    {
        $paiement = Paiement::findOrFail($id_paiement);

        // Création d'une facture en base
        $facture = Facture::create([
            'numero_facture' => 'FAC-' . strtoupper(uniqid()),
            'date_facture' => now(),
            'montant' => $paiement->montant,
            'id_paiement' => $paiement->id_paiement,
            'id_pays' => null, // optionnel
        ]);

        // Génération PDF avec Blade
        $pdf = Pdf::loadView('facture', compact('facture', 'paiement'));

        return $pdf->download($facture->numero_facture . '.pdf');
    }
}