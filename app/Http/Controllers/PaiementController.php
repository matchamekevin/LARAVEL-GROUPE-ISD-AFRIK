<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Paiement;
use App\Models\Formation;
use Barryvdh\DomPDF\Facade\Pdf;
use FedaPay\FedaPay;
use FedaPay\Transaction;
use FedaPay\Error\Base as FedaPayError;

class PaiementController extends Controller
{
    /**
     * GET /api/admin/paiements — Liste tous les paiements (admin)
     */
    public function adminIndex(Request $request)
    {
        $paiements = Paiement::with(['formation', 'utilisateur'])
            ->orderByDesc('date_paiement')
            ->get();

        return response()->json($paiements);
    }

    /**
     * Initier un paiement pour une formation
     */
    public function payFormation(Request $request, $idFormation)
    {
        $formation = Formation::findOrFail($idFormation);
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Vous devez être connecté ❌'], 401);
        }
        if (!$user->email || !filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['message' => 'Email invalide ❌'], 422);
        }
        if (!$user->telephone || !is_numeric($user->telephone)) {
            return response()->json(['message' => 'Téléphone invalide ❌'], 422);
        }
        if (!$formation->prix || !is_numeric($formation->prix) || $formation->prix <= 0) {
            return response()->json(['message' => 'Montant invalide ❌'], 422);
        }
        if (!$user->nom || !$user->prenom) {
            return response()->json(['message' => 'Nom ou prénom manquant ❌'], 422);
        }

        FedaPay::setApiKey(config('services.fedapay.secret'));
        FedaPay::setEnvironment(config('services.fedapay.env'));

        try {
            $callbackUrl = env('FEDAPAY_CALLBACK_URL');

            $transaction = Transaction::create([
                "description"  => "Paiement formation: " . $formation->titre,
                "amount"       => (float) $formation->prix,
                "currency"     => ["iso" => "XOF"],
                "callback_url" => $callbackUrl,
                "customer"     => [
                    "firstname"    => $user->nom,
                    "lastname"     => $user->prenom,
                    "email"        => $user->email,
                    "phone_number" => [
                        "number"  => $user->telephone,
                        "country" => "TG"
                    ]
                ]
            ]);

            $token       = $transaction->generateToken();
            $checkoutUrl = $token->url;

            $paiement = Paiement::create([
                'reference_transaction' => $transaction->id,
                'moyen_paiement'        => 'FedaPay',
                'statut_paiement'       => 'en_attente',
                'montant'               => $formation->prix,
                'date_paiement'         => now(),
                'id_formation'          => $formation->getKey(),
                'id_utilisateur'        => $user->getKey(),
            ]);

            return response()->json([
                'message'        => 'Paiement formation initié ✅',
                'paiement'       => $paiement,
                'checkout_url'   => $checkoutUrl,
                'transaction_id' => $transaction->id
            ]);

        } catch (FedaPayError $e) {
            Log::error('FedaPay error', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Erreur FedaPay ❌',
                'error'   => $e->getMessage()
            ], 500);

        } catch (\Exception $e) {
            Log::error('Erreur générale paiement', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Erreur lors de la création de la transaction ❌',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer un paiement avec sa formation — utilisé par FacturePage React
     */
    public function show($id)
    {
        $paiement = Paiement::with('formation')->findOrFail($id);

        return response()->json([
            'paiement' => $paiement
        ]);
    }

    /**
     * Callback POST — webhook FedaPay (serveur à serveur)
     */
    public function callback(Request $request)
    {
        $payload = $request->all();
        Log::info('FedaPay callback POST reçu', $payload);

        $transactionId = $payload['transaction']['id'] ?? $payload['id'] ?? null;
        $status        = $payload['transaction']['status'] ?? $payload['status'] ?? null;

        if (!$transactionId) {
            return response()->json(['message' => 'Transaction ID manquant ❌'], 400);
        }

        $paiement = Paiement::where('reference_transaction', $transactionId)->first();

        if (!$paiement) {
            return response()->json(['message' => 'Transaction introuvable ❌'], 404);
        }

        if ($status === 'approved') {
            $paiement->update([
                'statut_paiement' => 'réussi',
                'date_paiement'   => now(),
            ]);
        } elseif (in_array($status, ['canceled', 'declined'])) {
            $paiement->update([
                'statut_paiement' => 'échoué',
                'date_paiement'   => now(),
            ]);
        }

        return response()->json(['message' => 'Callback traité ✅']);
    }

    /**
     * Callback GET — redirection navigateur après paiement
     * FedaPay redirige ici avec ?status=approved&id=xxx
     */
    public function callbackReturn(Request $request)
    {
        $transactionId = $request->query('id');
        $status        = $request->query('status');

        Log::info('FedaPay callback GET reçu', [
            'id'     => $transactionId,
            'status' => $status
        ]);

        if (!$transactionId) {
            return redirect()->to(env('APP_FRONTEND_URL') . "/paiement-echec");
        }

        $paiement = Paiement::with(['formation', 'utilisateur'])
            ->where('reference_transaction', $transactionId)
            ->first();

        if (!$paiement) {
            return redirect()->to(env('APP_FRONTEND_URL') . "/paiement-echec");
        }

        if ($status === 'approved') {
            $paiement->update([
                'statut_paiement' => 'réussi',
                'date_paiement'   => now(),
            ]);

            // ✅ Redirection vers la FacturePage React
            return redirect()->to(env('APP_FRONTEND_URL') . "/facture/" . $paiement->id_paiement);
        }

        $paiement->update([
            'statut_paiement' => 'échoué',
            'date_paiement'   => now(),
        ]);

        return redirect()->to(env('APP_FRONTEND_URL') . "/paiement-echec");
    }

    /**
     * Générer un reçu PDF
     */
    public function genererRecu($idPaiement)
    {
        $paiement = Paiement::with(['formation', 'utilisateur'])->findOrFail($idPaiement);

        if ($paiement->statut_paiement !== 'réussi') {
            return response()->json([
                'message' => 'Impossible de générer un reçu pour un paiement non validé ❌'
            ], 400);
        }

        $pdf = Pdf::loadView('recu-paiement', compact('paiement'));

        return $pdf->download('recu-paiement-' . $paiement->id_paiement . '.pdf');
    }
}