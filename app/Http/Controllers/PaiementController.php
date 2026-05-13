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
     * Récupérer un paiement
     */
    public function show($id)
    {
        $paiement = Paiement::with(['formation', 'commande'])->findOrFail($id);

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

        $paiement = Paiement::where('reference_transaction', $transactionId)->first();

        if (! $paiement) {
            return response()->json(['message' => 'Transaction introuvable ❌'], 404);
        }

        if ($status === 'approved') {
            $paiement->update(['statut_paiement' => 'réussi', 'date_paiement' => now()]);
            if ($paiement->id_commande && $paiement->commande) {
                $paiement->commande->update(['statut' => 'payée']);
            }
        } elseif (in_array($status, ['canceled', 'declined'])) {
            $paiement->update(['statut_paiement' => 'échoué', 'date_paiement' => now()]);
        }

        return response()->json(['message' => 'Callback traité ✅']);
    }

    /**
     * Callback GET — redirection navigateur après paiement
     */
    public function callbackReturn(Request $request)
    {
        $transactionId = $request->query('id');
        $status = $request->query('status');

        Log::info('FedaPay callback GET reçu', ['id' => $transactionId, 'status' => $status]);

        if (! $transactionId) {
            return redirect()->to(env('APP_FRONTEND_URL').'/paiement-echec');
        }

        $paiement = Paiement::with(['formation', 'commande', 'utilisateur'])
            ->where('reference_transaction', $transactionId)
            ->first();

        if (! $paiement) {
            return redirect()->to(env('APP_FRONTEND_URL').'/paiement-echec');
        }

        if ($status === 'approved') {
            $paiement->update(['statut_paiement' => 'réussi', 'date_paiement' => now()]);
            if ($paiement->id_commande && $paiement->commande) {
                $paiement->commande->update(['statut' => 'payée']);
            }

            return redirect()->to(env('APP_FRONTEND_URL').'/facture/'.$paiement->id_paiement);
        }

        $paiement->update(['statut_paiement' => 'échoué', 'date_paiement' => now()]);

        return redirect()->to(env('APP_FRONTEND_URL').'/paiement-echec');
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
