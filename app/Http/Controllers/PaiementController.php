<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Paiement;
use App\Models\Formation;
use Barryvdh\DomPDF\Facade\Pdf;
use FedaPay\FedaPay;
use FedaPay\Transaction;
use FedaPay\Webhook;
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

    private function configureFedaPay(): bool
    {
        $secret = config('services.fedapay.secret');
        $environment = config('services.fedapay.env');

        if (empty($secret) || empty($environment)) {
            Log::error('FedaPay credentials missing');
            return false;
        }

        FedaPay::setApiKey($secret);
        FedaPay::setEnvironment($environment);

        return true;
    }

    private function frontendRedirect(string $path): string
    {
        $base = rtrim((string) env('APP_FRONTEND_URL', env('APP_URL', 'http://127.0.0.1:8000')), '/');

        return $base . '/' . ltrim($path, '/');
    }

    private function canAccessPayment(Request $request, Paiement $paiement): bool
    {
        $user = $request->user();

        return $user !== null
            && ((int) $paiement->id_utilisateur === (int) $user->getKey() || (bool) $user->is_admin);
    }

    private function verifyWebhookSignature(Request $request): bool
    {
        $secret = config('services.fedapay.webhook_secret');
        if (!$secret) {
            return true;
        }

        $signature = $request->headers->get('x-fedapay-signature')
            ?? $request->headers->get('fedapay-signature')
            ?? $request->headers->get('signature');

        if (!$signature) {
            Log::warning('FedaPay webhook rejected: missing signature header');
            return false;
        }

        try {
            Webhook::constructEvent($request->getContent(), $signature, $secret);
            return true;
        } catch (\Throwable $exception) {
            Log::warning('FedaPay webhook rejected: invalid signature', [
                'message' => $exception->getMessage(),
            ]);
            return false;
        }
    }

    private function fetchRemoteTransaction(string|int $transactionId): ?Transaction
    {
        if (!$this->configureFedaPay()) {
            return null;
        }

        try {
            return Transaction::retrieve($transactionId);
        } catch (\Throwable $exception) {
            Log::error('Unable to retrieve FedaPay transaction', [
                'transaction_id' => $transactionId,
                'message' => $exception->getMessage(),
            ]);

            return null;
        }
    }

    private function syncPaymentStatusFromTransaction(Paiement $paiement, Transaction $transaction): void
    {
        $remoteStatus = (string) ($transaction->status ?? '');

        if ($transaction->wasPaid()) {
            $paiement->update([
                'statut_paiement' => 'réussi',
                'date_paiement' => now(),
            ]);
            return;
        }

        if (in_array($remoteStatus, ['canceled', 'declined', 'failed', 'expired'], true)) {
            $paiement->update([
                'statut_paiement' => 'échoué',
                'date_paiement' => now(),
            ]);
            return;
        }

        $paiement->update([
            'statut_paiement' => 'en_attente',
        ]);
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

        if (!$this->configureFedaPay()) {
            return response()->json([
                'message' => 'Configuration paiement indisponible.'
            ], 500);
        }

        try {
            $callbackUrl = env('FEDAPAY_CALLBACK_URL', route('paiement.callback'));

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
                'message' => 'Erreur lors de l\'initialisation du paiement.'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Erreur générale paiement', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Erreur lors de la création de la transaction.'
            ], 500);
        }
    }

    /**
     * Récupérer un paiement avec sa formation — utilisé par FacturePage React
     */
    public function show(Request $request, $id)
    {
        $paiement = Paiement::with(['formation', 'utilisateur'])->findOrFail($id);

        if (!$this->canAccessPayment($request, $paiement)) {
            return response()->json([
                'message' => 'Accès interdit à ce paiement.'
            ], 403);
        }

        return response()->json([
            'paiement' => $paiement
        ]);
    }

    /**
     * Callback POST — webhook FedaPay (serveur à serveur)
     */
    public function callback(Request $request)
    {
        if (!$this->verifyWebhookSignature($request)) {
            return response()->json(['message' => 'Signature webhook invalide.'], 400);
        }

        $payload = $request->all();
        Log::info('FedaPay callback POST reçu', $payload);

        $transactionId = $payload['transaction']['id'] ?? $payload['id'] ?? null;

        if (!$transactionId) {
            return response()->json(['message' => 'Transaction ID manquant ❌'], 400);
        }

        $paiement = Paiement::where('reference_transaction', $transactionId)->first();

        if (!$paiement) {
            return response()->json(['message' => 'Transaction introuvable ❌'], 404);
        }

        $transaction = $this->fetchRemoteTransaction($transactionId);
        if (!$transaction) {
            return response()->json(['message' => 'Impossible de vérifier la transaction.'], 502);
        }

        $this->syncPaymentStatusFromTransaction($paiement, $transaction);

        return response()->json(['message' => 'Callback traité ✅']);
    }

    /**
     * Callback GET — redirection navigateur après paiement
     * FedaPay redirige ici avec ?status=approved&id=xxx
     */
    public function callbackReturn(Request $request)
    {
        $transactionId = $request->query('id');

        Log::info('FedaPay callback GET reçu', [
            'id'     => $transactionId,
            'status' => $request->query('status')
        ]);

        if (!$transactionId) {
            return redirect()->to($this->frontendRedirect('/paiement-echec'));
        }

        $paiement = Paiement::with(['formation', 'utilisateur'])
            ->where('reference_transaction', $transactionId)
            ->first();

        if (!$paiement) {
            return redirect()->to($this->frontendRedirect('/paiement-echec'));
        }

        $transaction = $this->fetchRemoteTransaction($transactionId);
        if (!$transaction) {
            return redirect()->to($this->frontendRedirect('/paiement-echec'));
        }

        $this->syncPaymentStatusFromTransaction($paiement, $transaction);

        if ($paiement->statut_paiement === 'réussi') {
            return redirect()->to($this->frontendRedirect('/facture/' . $paiement->id_paiement));
        }

        return redirect()->to($this->frontendRedirect('/paiement-echec'));
    }

    /**
     * Générer un reçu PDF
     */
    public function facture(Request $request, $idPaiement)
    {
        $paiement = Paiement::with(['formation', 'utilisateur'])->findOrFail($idPaiement);

        if (!$this->canAccessPayment($request, $paiement)) {
            return response()->json([
                'message' => 'Accès interdit à cette facture.'
            ], 403);
        }

        if ($paiement->statut_paiement !== 'réussi') {
            return response()->json([
                'message' => 'Impossible de générer un reçu pour un paiement non validé ❌'
            ], 400);
        }

        $pdf = Pdf::loadView('recu-paiement', compact('paiement'));

        return $pdf->download('recu-paiement-' . $paiement->id_paiement . '.pdf');
    }

    public function genererRecu(Request $request, $idPaiement)
    {
        return $this->facture($request, $idPaiement);
    }

    public function testPaiement()
    {
        return response()->json([
            'message' => 'Endpoint de test désactivé.'
        ], 403);
    }
}
