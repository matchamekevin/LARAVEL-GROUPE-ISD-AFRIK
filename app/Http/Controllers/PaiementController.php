<?php

namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\Formation;
use App\Models\Paiement;
use App\Models\Pays;
use App\Models\Produit;
use Barryvdh\DomPDF\Facade\Pdf;
use FedaPay\Error\Base as FedaPayError;
use FedaPay\FedaPay;
use FedaPay\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaiementController extends Controller
{
    private function resolvePhoneCountryIsoFromPays(?int $idPays): string
    {
        if (! $idPays) {
            return 'TG';
        }

        $codePays = (string) (Pays::query()->where('id_pays', $idPays)->value('code_pays') ?? '');
        $digits = preg_replace('/\D+/', '', $codePays);

        $isoByDialCode = [
            '228' => 'TG',
            '229' => 'BJ',
            '225' => 'CI',
            '226' => 'BF',
            '227' => 'NE',
        ];

        return $isoByDialCode[$digits] ?? 'TG';
    }

    private function normalizePhoneNumberForGateway(?string $value, ?string $countryCode = null): string
    {
        $digits = preg_replace('/\D+/', '', (string) $value);
        if ($digits === '') {
            return '00000000';
        }

        $countryDigits = preg_replace('/\D+/', '', (string) $countryCode);
        if ($countryDigits !== '' && str_starts_with($digits, $countryDigits)) {
            $national = substr($digits, strlen($countryDigits));
            if ($national !== '') {
                return $national;
            }
        }

        if (str_starts_with($digits, '0') && strlen($digits) > 8) {
            return ltrim($digits, '0');
        }

        return $digits;
    }

    private function configureFedapay()
    {
        $secret = (string) config('services.fedapay.secret', '');
        $environment = (string) config('services.fedapay.env', 'live');
        $callbackUrl = (string) config('services.fedapay.callback_url', '');

        if ($secret === '' || $callbackUrl === '') {
            Log::error('FedaPay credentials missing', [
                'secret' => $secret !== '' ? 'configured' : null,
                'env' => $environment !== '' ? $environment : null,
                'callback_url' => $callbackUrl !== '' ? 'configured' : null,
            ]);

            return response()->json([
                'message' => 'Configuration FedaPay manquante ❌',
            ], 500);
        }

        FedaPay::setApiKey($secret);
        FedaPay::setEnvironment($environment);

        return null;
    }

    private function restaurerStockCommande($commande): void
    {
        if (! $commande || ! $commande->id_commande) {
            return;
        }

        // Chercher le paiement lié à cette commande pour obtenir le produit et la quantité
        $paiement = Paiement::where('id_commande', $commande->id_commande)->first();

        if (! $paiement || ! $paiement->id_produit || ! $paiement->quantite) {
            return;
        }

        $produit = Produit::find($paiement->id_produit);
        if ($produit) {
            $produit->increment('stock', $paiement->quantite);
            if ($produit->statut === 'rupture' && $produit->fresh()->stock > 0) {
                $produit->update(['statut' => 'disponible']);
            }
        }
    }

    /**
     * Initier un paiement pour une formation
     */
    public function payFormation(Request $request, $idFormation)
    {
        $formation = Formation::findOrFail($idFormation);
        $user = $request->user();
        $user->loadMissing('pays');

        if (! $user) {
            return response()->json(['message' => 'Vous devez être connecté ❌'], 401);
        }
        if (! $user->email || ! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['message' => 'Email invalide ❌'], 422);
        }
        if (! $user->telephone) {
            return response()->json(['message' => 'Téléphone invalide ❌'], 422);
        }
        if (! $formation->prix || ! is_numeric($formation->prix) || $formation->prix <= 0) {
            return response()->json(['message' => 'Montant invalide ❌'], 422);
        }
        if (! $user->nom || ! $user->prenom) {
            return response()->json(['message' => 'Nom ou prénom manquant ❌'], 422);
        }

        $phoneCountry = $this->resolvePhoneCountryIsoFromPays((int) ($user->id_pays ?? 0));
        $phoneNumber = $this->normalizePhoneNumberForGateway(
            (string) $user->telephone,
            $user->pays?->code_pays
        );

        if ($phoneNumber === '00000000') {
            return response()->json(['message' => 'Téléphone invalide ❌'], 422);
        }

        $configError = $this->configureFedapay();
        if ($configError) {
            return $configError;
        }

        try {
            $callbackUrl = (string) config('services.fedapay.callback_url');

            $transaction = Transaction::create([
                'description' => 'Paiement formation: '.$formation->titre,
                'amount' => (float) $formation->prix,
                'currency' => ['iso' => 'XOF'],
                'callback_url' => $callbackUrl,
                'customer' => [
                    'firstname' => $user->nom,
                    'lastname' => $user->prenom,
                    'email' => $user->email,
                    'phone_number' => [
                        'number' => $phoneNumber,
                        'country' => $phoneCountry,
                    ],
                ],
            ]);

            $token = $transaction->generateToken();
            $checkoutUrl = $token->url;

            $paiement = Paiement::create([
                'uuid' => (string) Str::uuid(),
                'reference_transaction' => $transaction->id,
                'moyen_paiement' => 'FedaPay',
                'statut_paiement' => 'en_attente',
                'montant' => $formation->prix,
                'date_paiement' => now(),
                'id_formation' => $formation->getKey(),
                'id_utilisateur' => $user->getKey(),
            ]);

            return response()->json([
                'message' => 'Paiement formation initié ✅',
                'paiement' => $paiement,
                'checkout_url' => $checkoutUrl,
                'transaction_id' => $transaction->id,
            ]);

        } catch (FedaPayError $e) {
            Log::error('FedaPay error', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Erreur FedaPay ❌', 'error' => $e->getMessage()], 500);
        } catch (\Exception $e) {
            Log::error('Erreur générale paiement', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Erreur lors de la création de la transaction ❌', 'error' => $e->getMessage()], 500);
        }
    }

    // ================================================================
    // ✅ PAIEMENT PRODUIT
    // ================================================================

    /**
     * POST /api/produits/paiement
     * Initier un paiement pour un produit
     */
    public function payProduits(Request $request)
    {
        $user = $request->user();
        $user->loadMissing('pays');

        if (! $user) {
            return response()->json(['message' => 'Vous devez être connecté ❌'], 401);
        }

        // ✅ Champs livraison optionnels — fallback vers le profil utilisateur
        try {
            $data = $request->validate([
                'id_produit' => 'required|exists:produits,id_produit',
                'quantite' => 'required|integer|min:1',
                'nom_livraison' => 'nullable|string|max:255',
                'prenom_livraison' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'telephone' => 'nullable|string|max:50',
                'adresse' => 'nullable|string|max:500',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation failed for payProduits', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            throw $e;
        }

        $produit = Produit::findOrFail($data['id_produit']);
        $quantite = (int) $data['quantite'];

        if ($produit->statut === 'rupture') {
            return response()->json(['message' => 'Produit en rupture de stock ❌'], 409);
        }
        if ($produit->stock < $quantite) {
            return response()->json(['message' => "Stock insuffisant. Disponible : {$produit->stock} ❌"], 409);
        }

        $prixFinal = $produit->isPrixPromoActif() ? (float) $produit->prix_promo : (float) $produit->prix;
        $montant = $prixFinal * $quantite;

        if ($montant <= 0) {
            return response()->json(['message' => 'Montant invalide ❌'], 422);
        }

        // ✅ Fallback vers le profil utilisateur si champs non fournis
        $nomLivraison = $data['nom_livraison'] ?? $user->nom ?? 'Client';
        $prenomLivraison = $data['prenom_livraison'] ?? $user->prenom ?? 'ISD';
        $email = $data['email'] ?? $user->email ?? '';
        $telephone = $data['telephone'] ?? $user->telephone ?? '00000000';
        $phoneCountry = $this->resolvePhoneCountryIsoFromPays((int) ($user->id_pays ?? 0));
        $phoneNumber = $this->normalizePhoneNumberForGateway(
            (string) $telephone,
            $user->pays?->code_pays
        );

        $configError = $this->configureFedapay();
        if ($configError) {
            return $configError;
        }

        try {
            $callbackUrl = (string) config('services.fedapay.callback_url');

            $transaction = Transaction::create([
                'description' => "Achat produit: {$produit->titre} (x{$quantite})",
                'amount' => (float) $montant,
                'currency' => ['iso' => 'XOF'],
                'callback_url' => $callbackUrl,
                'customer' => [
                    'firstname' => $nomLivraison,
                    'lastname' => $prenomLivraison,
                    'email' => $email,
                    'phone_number' => [
                        'number' => $phoneNumber,
                        'country' => $phoneCountry,
                    ],
                ],
            ]);

            $token = $transaction->generateToken();
            $checkoutUrl = $token->url;

            // Créer la commande
            $commande = Commande::create([
                'uuid' => (string) Str::uuid(), // ✅ AJOUTÉ
                'numero_commande' => 'CMD-'.strtoupper(Str::random(10)),
                'statut' => 'en_attente',
                'type_commande' => 'produit',
                'montant_total' => $montant,
                'id_utilisateur' => $user->getKey(),
            ]);

            // Créer le paiement
            $paiement = Paiement::create([
                'uuid' => (string) Str::uuid(),
                'reference_transaction' => $transaction->id,
                'moyen_paiement' => 'FedaPay',
                'statut_paiement' => 'en_attente',
                'montant' => $montant,
                'date_paiement' => now(),
                'id_commande' => $commande->id_commande,
                'id_utilisateur' => $user->getKey(),
                'id_produit' => $data['id_produit'],
                'quantite' => $quantite,
            ]);

            // Décrémenter le stock
            $produit->decrement('stock', $quantite);
            if ($produit->fresh()->stock <= 0) {
                $produit->update(['statut' => 'rupture']);
            }

            return response()->json([
                'message' => 'Paiement produit initié ✅',
                'produit' => $produit->titre,
                'quantite' => $quantite,
                'montant' => $montant,
                'commande' => $commande->numero_commande,
                'paiement' => $paiement,
                'checkout_url' => $checkoutUrl,
                'transaction_id' => $transaction->id,
            ]);

        } catch (FedaPayError $e) {
            Log::error('FedaPay produit error', [
                'message' => $e->getMessage(),
                'http_status' => $e->getHttpStatus(),
                'http_body' => $e->getHttpBody(),
                'json_body' => $e->getJsonBody(),
            ]);

            return response()->json(['message' => 'Erreur FedaPay ❌', 'error' => $e->getMessage()], 500);
        } catch (\Exception $e) {
            Log::error('Erreur paiement produit', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['message' => 'Erreur lors de la création de la transaction ❌', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/admin/paiements — Liste paginée des paiements (admin)
     */
    public function adminIndex(Request $request)
    {
        $perPage = max(1, min(50, (int) $request->query('per_page', 20)));
        $page = max(1, (int) $request->query('page', 1));
        $search = trim((string) $request->query('q', ''));

        $query = Paiement::with(['commande', 'formation', 'produit', 'utilisateur'])
            ->orderByDesc('date_paiement');

        if ($search !== '') {
            $like = "%{$search}%";
            $query->where(function ($q) use ($like) {
                $q->where('reference_transaction', 'ILIKE', $like)
                  ->orWhereHas('utilisateur', function ($uq) use ($like) {
                      $uq->where('email', 'ILIKE', $like)
                         ->orWhere('prenom', 'ILIKE', $like)
                         ->orWhere('nom', 'ILIKE', $like);
                  });
            });
        }

        $paiements = $query->paginate($perPage, ['*'], 'page', $page)->appends($request->query());

        return response()->json($paiements);
    }

    /**
     * Récupérer un paiement
     */
    public function show($id)
    {
        $paiement = Paiement::with(['formation', 'commande', 'produit'])->findOrFail($id);

        return response()->json(['paiement' => $paiement]);
    }

    /**
     * Callback POST — webhook FedaPay (serveur à serveur)
     */
    public function callback(Request $request)
    {
        $payload = $request->all();
        $transactionId = $payload['transaction']['id'] ?? $payload['id'] ?? null;
        $status = $payload['transaction']['status'] ?? $payload['status'] ?? null;

        Log::info('FedaPay callback POST reçu', $payload);

        if (! $transactionId) {
            return response()->json(['message' => 'Transaction ID manquant ❌'], 400);
        }

        $paiement = Paiement::with(['commande'])->where('reference_transaction', $transactionId)->first();

        if (! $paiement) {
            return response()->json(['message' => 'Transaction introuvable ❌'], 404);
        }

        // Éviter de retraiter un paiement déjà dans un état final
        if (in_array($paiement->statut_paiement, ['réussi', 'échoué'])) {
            Log::info('Paiement déjà traité, ignoré', [
                'id_paiement' => $paiement->id_paiement,
                'statut_actuel' => $paiement->statut_paiement,
            ]);
            return response()->json(['message' => 'Déjà traité']);
        }

        if ($status === 'approved') {
            $paiement->update(['statut_paiement' => 'réussi', 'date_paiement' => now()]);
            if ($paiement->id_commande && $paiement->commande) {
                $paiement->commande->update(['statut' => 'payée']);
            }
        } elseif (in_array($status, ['canceled', 'declined', 'expired'])) {
            $paiement->update(['statut_paiement' => 'échoué', 'date_paiement' => now()]);

            // Restaurer le stock si paiement produit annulé
            if ($paiement->id_commande && $paiement->commande) {
                $this->restaurerStockCommande($paiement->commande);
            }
        }

        return response()->json(['message' => 'Callback traité ✅']);
    }

    /**
     * Récupère les détails d'une transaction FedaPay pour enrichir le message d'erreur
     */
    private function fetchFedapayTransactionDetails(string $transactionId): ?array
    {
        try {
            $this->configureFedapay();
            $transaction = \FedaPay\Transaction::retrieve($transactionId);

            return [
                'status' => $transaction->status ?? null,
                'description' => $transaction->description ?? null,
                'mode' => $transaction->mode ?? null,
            ];
        } catch (\Exception $e) {
            Log::warning('Impossible de récupérer la transaction FedaPay', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Redirige le navigateur avec une page HTML + JS pour garantir la redirection
     * (plus fiable que redirect()->to() qui peut être bloqué par le navigateur
     *  lors d'un changement de protocole HTTPS → HTTP ou cross-origin)
     */
    private function redirectWithFallback(string $url): \Illuminate\Http\Response
    {
        $escapedUrl = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');

        return response()->make(
            <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Redirection...</title>
    <meta http-equiv="refresh" content="0;url={$escapedUrl}">
    <script>window.location.replace("{$escapedUrl}");</script>
</head>
<body>
    <p>Redirection en cours... <a href="{$escapedUrl}">Cliquez ici si rien ne se passe</a></p>
</body>
</html>
HTML
            , 200, ['Content-Type' => 'text/html']
        );
    }

    /**
     * Callback GET — redirection navigateur après paiement
     */
    public function callbackReturn(Request $request)
    {
        $transactionId = $request->query('id');
        $status = $request->query('status');
        $errorMessage = $request->query('message');

        Log::info('FedaPay callback GET reçu', [
            'id' => $transactionId,
            'status' => $status,
            'message' => $errorMessage,
        ]);

        $frontendUrl = config('app.frontend_url');

        if (! $transactionId) {
            return $this->redirectWithFallback($frontendUrl.'/paiement/result?status=erreur&message='.urlencode('Transaction introuvable'));
        }

        $paiement = Paiement::with(['formation', 'commande', 'produit', 'utilisateur'])
            ->where('reference_transaction', $transactionId)
            ->first();

        if (! $paiement) {
            return $this->redirectWithFallback($frontendUrl.'/paiement/result?status=erreur&message='.urlencode('Paiement introuvable'));
        }

        if ($status === 'approved' || $paiement->statut_paiement === 'réussi') {
            if ($paiement->statut_paiement !== 'réussi') {
                $paiement->update(['statut_paiement' => 'réussi', 'date_paiement' => now()]);
                if ($paiement->id_commande && $paiement->commande) {
                    $paiement->commande->update(['statut' => 'payée']);
                }
            }

            return $this->redirectWithFallback($frontendUrl.'/facture/'.$paiement->id_paiement);
        }

        // Ne pas traiter si déjà dans un état final
        if (in_array($paiement->statut_paiement, ['réussi', 'échoué'])) {
            Log::info('Paiement déjà traité (GET)', [
                'id_paiement' => $paiement->id_paiement,
                'statut' => $paiement->statut_paiement,
            ]);
            $type = $paiement->id_formation ? 'formation' : ($paiement->id_commande ? 'commande' : 'inconnu');
            $params = http_build_query([
                'status' => $paiement->statut_paiement === 'réussi' ? 'reussi' : 'echoue',
                'message' => $paiement->statut_paiement === 'réussi' ? 'Paiement déjà validé' : 'Paiement déjà traité',
                'type' => $type,
                'id' => $paiement->id_formation ?? $paiement->id_commande,
            ]);
            return $this->redirectWithFallback($frontendUrl.'/paiement/result?'.$params);
        }

        // Vérifier si l'utilisateur a fermé la page de paiement FedaPay (close=true)
        $close = $request->query('close');

        if ($close === 'true') {
            $errorMessage = 'Paiement annulé — vous avez fermé la page de paiement';
        }

        // Essayer d'obtenir le vrai message d'erreur depuis l'API FedaPay
        if (! $errorMessage) {
            $details = $this->fetchFedapayTransactionDetails($transactionId);

            if ($details && $details['status']) {
                $fedapayStatus = $details['status'];
                $errorMessage = match ($fedapayStatus) {
                    'canceled' => 'Paiement annulé par l\'utilisateur',
                    'declined' => 'Transaction refusée par la banque ou l\'opérateur (solde insuffisant, code erroné, etc.)',
                    'expired'  => 'Le délai de paiement a expiré',
                    'pending'  => 'Paiement annulé — vous avez fermé la fenêtre de paiement',
                    default    => 'Erreur de paiement : '.$fedapayStatus,
                };

                if (! empty($details['description'])) {
                    $errorMessage = $details['description'];
                }
            } else {
                $errorMessage = match ($status) {
                    'canceled' => 'Paiement annulé',
                    'declined' => 'Paiement refusé',
                    'expired'  => 'La session de paiement a expiré',
                    'pending'  => 'Paiement annulé',
                    default    => 'Erreur de paiement',
                };
            }
        }

        $paiement->update(['statut_paiement' => 'échoué', 'date_paiement' => now()]);

        // Restaurer le stock si paiement produit annulé
        if ($paiement->id_commande && $paiement->commande) {
            $this->restaurerStockCommande($paiement->commande);
        }

        // Déterminer le contexte et le message d'erreur
        $type = 'inconnu';
        $id = null;
        if ($paiement->id_formation) {
            $type = 'formation';
            $id = $paiement->id_formation;
        } elseif ($paiement->id_commande) {
            $type = 'commande';
            $id = $paiement->id_commande;
        } elseif ($paiement->id_produit) {
            $type = 'produit';
            $id = $paiement->id_produit;
        }

        $params = http_build_query([
            'status' => 'echoue',
            'message' => $errorMessage,
            'type' => $type,
            'id' => $id,
        ]);

        return $this->redirectWithFallback($frontendUrl.'/paiement/result?'.$params);
    }

    /**
     * Générer un reçu PDF
     */
    public function genererRecu($idPaiement)
    {
        $paiement = Paiement::with(['formation', 'utilisateur'])->findOrFail($idPaiement);

        if ($paiement->statut_paiement !== 'réussi') {
            return response()->json(['message' => 'Impossible de générer un reçu pour un paiement non validé ❌'], 400);
        }

        $pdf = Pdf::loadView('recu-paiement', compact('paiement'));

        return $pdf->download('recu-paiement-'.$paiement->id_paiement.'.pdf');
    }
}
