<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\Image;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use FedaPay\Transaction;
use FedaPay\FedaPay;

class FormationController extends Controller
{
    /** Liste toutes les formations */
    public function index()
    {
        $formations = Formation::with(['pays', 'images'])->get();

        foreach ($formations as $formation) {
            foreach ($formation->images as $img) {
                $img->url = $this->normalizeImageUrl($img->url);
            }
        }

        return response()->json($formations, 200);
    }

    /** Crée une nouvelle formation */
    public function store(Request $request)
    {
        $data = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'required|string',
            'duree' => 'required|integer',
            'prix' => 'required|numeric',
            'categorie' => 'required|string|in:particulier,etudiant,entreprise',
            'date_debut' => 'required|date',
            'places_disponibles' => 'required|integer|min:1',
            'id_pays' => 'required|exists:pays,id_pays',
        ]);

        $formation = Formation::create($data);

        return response()->json($formation->load(['pays']), 201);
    }

    /** Affiche une formation précise par ID */
    public function show($id)
    {
        if (!is_numeric($id)) {
            return response()->json([
                'error' => 'L\'identifiant doit être un nombre. Utilisez /formations/type/{categorie} pour filtrer par type.'
            ], 400);
        }

        $formation = Formation::with(['pays', 'images'])->findOrFail((int)$id);

        foreach ($formation->images as $img) {
            $img->url = $this->normalizeImageUrl($img->url);
        }

        return response()->json($formation, 200);
    }

    /** Met à jour une formation */
    public function update(Request $request, $id)
    {
        $formation = Formation::findOrFail($id);

        $data = $request->validate([
            'titre' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'duree' => 'sometimes|integer',
            'prix' => 'sometimes|numeric',
            'categorie' => 'sometimes|string|in:particulier,etudiant,entreprise',
            'date_debut' => 'sometimes|date',
            'places_disponibles' => 'sometimes|integer|min:1',
            'id_pays' => 'sometimes|exists:pays,id_pays',
        ]);

        $formation->update($data);

        return response()->json($formation->load(['pays']), 200);
    }

    /** Supprime une formation */
    public function destroy($id)
    {
        Formation::findOrFail($id)->delete();
        return response()->json(['message' => 'Formation supprimée avec succès'], 200);
    }

    /** Filtrer par type (particulier, étudiant, entreprise) */
    public function getByType($type)
    {
        $normalizedType = Str::of((string) $type)
            ->trim()
            ->lower()
            ->replace(['é', 'è', 'ê', 'ë'], 'e')
            ->toString();

        $aliases = [
            'etudiant' => ['etudiant', 'etudiants', 'étudiant', 'étudiants'],
            'particulier' => ['particulier', 'particuliers'],
            'entreprise' => ['entreprise', 'entreprises'],
        ];

        $rawValues = $aliases[$normalizedType] ?? [(string) $type];
        $matchValues = collect($rawValues)
            ->map(fn($value) => Str::lower(trim((string) $value)))
            ->unique()
            ->values();

        $formations = Formation::with(['pays', 'images'])
            ->where(function ($query) use ($matchValues) {
                foreach ($matchValues as $value) {
                    $query->orWhereRaw('LOWER(TRIM(categorie)) = ?', [$value]);
                }
            })
            ->get();

        foreach ($formations as $formation) {
            foreach ($formation->images as $img) {
                $img->url = $this->normalizeImageUrl($img->url);
            }
        }

        return response()->json($formations, 200);
    }

    private function normalizeImageUrl(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }

        $trimmed = trim($url);
        if ($trimmed === '') {
            return null;
        }

        if (preg_match('/^\/+https?:\/\//i', $trimmed)) {
            return ltrim($trimmed, '/');
        }

        if (preg_match('/^https?:\/\//i', $trimmed)) {
            return $trimmed;
        }

        return '/' . ltrim($trimmed, '/');
    }


    public function registerUser(Request $request, $id)
{
    $formation = Formation::findOrFail($id);
    $user = $request->user();

    if (!$user) {
        return response()->json([
            'message' => 'Authentification requise.'
        ], 401);
    }

    $data = $request->validate([
        'responsable_nom'         => 'required|string|max:255',
        'responsable_prenom'      => 'required|string|max:255',
        'civilite'                => 'nullable|string|in:Monsieur,Madame,Mademoiselle',
        'fonction'                => 'nullable|string|max:255',
        'email'                   => 'required|email',
        'telephone'               => 'nullable|string|max:50',
        'mobile'                  => 'nullable|string|max:50',
        'societe'                 => 'nullable|string|max:255',
        'adresse_societe'         => 'nullable|string|max:255',
        'participants'            => 'required|array|min:1',
        'participants.*.nom'      => 'required|string|max:255',
        'participants.*.prenom'   => 'required|string|max:255',
        'participants.*.fonction' => 'nullable|string|max:255',
        'participants.*.contact'  => 'nullable|string|max:100',
        'participants.*.prix'     => 'nullable|numeric',
        'facturation'             => 'required|string|in:participant,societe',
    ]);

    $userId = (int) $user->getKey();

    // ✅ BLOCAGE DOUBLON — vérifier avant tout INSERT
    $dejaInscrit = $formation->users()
        ->wherePivot('id_utilisateur', $userId)
        ->exists();

    if ($dejaInscrit) {
        return response()->json([
            'message' => 'Vous êtes déjà inscrit à cette formation.'
        ], 409);
    }

    // ✅ Wrapper dans un try/catch pour attraper tout doublon inattendu
    try {
        // Attacher l'utilisateur
        $formation->users()->attach($userId, [
            'responsable_nom'    => $data['responsable_nom'],
            'responsable_prenom' => $data['responsable_prenom'],
            'civilite'           => $data['civilite'] ?? null,
            'fonction'           => $data['fonction'] ?? null,
            'email'              => $data['email'],
            'telephone'          => $data['telephone'] ?? null,
            'mobile'             => $data['mobile'] ?? null,
            'societe'            => $data['societe'] ?? null,
            'adresse_societe'    => $data['adresse_societe'] ?? null,
            'facturation'        => $data['facturation'],
        ]);

        // Créer les participants
        foreach ($data['participants'] as $participant) {
            $formation->participants()->create([
                'nom'            => $participant['nom'],
                'prenom'         => $participant['prenom'],
                'fonction'       => $participant['fonction'] ?? null,
                'contact'        => $participant['contact'] ?? null,
                'prix'           => $participant['prix'] ?? null,
                'id_utilisateur' => $userId,
            ]);
        }

        // Créer le paiement
        $paiement = Paiement::create([
            'reference_transaction' => Str::uuid(),
            'moyen_paiement'        => 'fedapay',
            'statut_paiement'       => 'en_attente',
            'montant'               => $formation->prix,
            'date_paiement'         => now(),
            'id_formation'          => $formation->id_formation,
            'id_utilisateur'        => $userId,
        ]);

        return response()->json([
            'message'     => 'Inscription réussie ✅',
            'inscription' => [
                'id_utilisateur'     => $userId,
                'id_formation'       => $formation->id_formation,
                'responsable_nom'    => $data['responsable_nom'],
                'responsable_prenom' => $data['responsable_prenom'],
                'email'              => $data['email'],
                'facturation'        => $data['facturation'],
            ],
            'paiement' => [
                'id_paiement'      => $paiement->id_paiement,
                'statut_paiement'  => $paiement->statut_paiement,
                'montant'          => $paiement->montant,
            ]
        ], 201);

    } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
        // ✅ Filet de sécurité si doublon passe quand même
        return response()->json([
            'message' => 'Vous êtes déjà inscrit à cette formation.'
        ], 409);
    }
}
    public function initPaiement(Request $request, $idPaiement)
    {
        $authUser = $request->user();
        if (!$authUser) {
            return response()->json([
                'message' => 'Authentification requise.'
            ], 401);
        }

        // Récupérer le paiement
        $paiement = Paiement::findOrFail($idPaiement);

        if ((int) $paiement->id_utilisateur !== (int) $authUser->getKey() && !$authUser->is_admin) {
            return response()->json([
                'message' => 'Accès interdit à ce paiement.'
            ], 403);
        }
    
        // Récupérer la formation liée
        $formation = Formation::findOrFail($paiement->id_formation);
    
        // Récupérer l'utilisateur lié à la formation
        $user = $formation->users()
            ->where('id_utilisateur', $paiement->id_utilisateur)
            ->first();
    
        if (!$user || !$user->pivot) {
            return response()->json([
                'message' => 'Utilisateur non trouvé pour ce paiement'
            ], 404);
        }
    
        // Initialiser FedaPay
        \FedaPay\FedaPay::setApiKey(config('services.fedapay.secret'));
        \FedaPay\FedaPay::setEnvironment(config('services.fedapay.env', 'live'));
    
        // Créer la transaction FedaPay
        $transaction = \FedaPay\Transaction::create([
            'amount' => (float) $paiement->montant, // ✅ cast en float
            'currency' => ['iso' => 'XOF'],
            'description' => 'Paiement formation ' . $formation->titre,
            'customer' => [
                'email' => $user->pivot->email,
                'firstname' => $user->pivot->responsable_nom,
                'lastname' => $user->pivot->responsable_prenom,
            ],
            'callback_url' => route('paiement.callback'),
        ]);
    
        // ✅ Retour JSON avec l’URL de checkout
        return response()->json([
            'message' => 'Paiement initié ✅',
            'checkout_url' => $transaction->generateCheckoutUrl(),
            'transaction_id' => $transaction->id,
            'paiement' => [
                'id_paiement' => $paiement->id_paiement,
                'statut_paiement' => $paiement->statut_paiement,
                'montant' => $paiement->montant
            ]
        ], 200);
    }

/** Ajouter un commentaire à une formation */
        public function addCommentaire(Request $request, $id)
        {
            $formation = Formation::findOrFail($id);
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Authentification requise.'
                ], 401);
            }
    
            $data = $request->validate([
                'contenu' => 'required|string',
                'note' => 'nullable|integer|min:1|max:5',
            ]);

            $commentaire = $formation->commentaires()->create([
                'contenu' => $data['contenu'],
                'note' => $data['note'] ?? null,
                'id_utilisateur' => $user->id_utilisateur,
            ]);
    
            return response()->json($commentaire, 201);
        }
    
        /** Créer une formation avec image et commentaire en une seule requête */
        public function storeWithRelations(Request $request)
        {
            $formationData = $request->validate([
                'titre' => 'required|string|max:255',
                'description' => 'required|string',
                'duree' => 'required|integer',
                'prix' => 'required|numeric',
                'categorie' => 'required|string|in:particulier,etudiant,entreprise',
                'date_debut' => 'required|date',
                'places_disponibles' => 'required|integer|min:1',
                'id_pays' => 'required|exists:pays,id_pays',
            ]);
    
            $formation = Formation::create($formationData);
    
            if ($request->filled('image.url')) {
                Image::create([
                    'url' => $request->input('image.url'),
                    'path' => $request->input('image.url'),
                    'alt' => $request->input('image.alt'),
                    'imageable_type' => 'FORMATION',
                    'imageable_id' => $formation->id_formation
                ]);
            }
    
            return response()->json($formation->load(['pays']), 201);
        }

    /** Récupérer les images des catégories de formation */
    public function getCategoryImages()
    {
        $categoryImages = Image::where('imageable_type', 'CATEGORY')
            ->get()
            ->map(function ($image) {
                $image->url = asset($image->url);
                return $image;
            });

        return response()->json($categoryImages, 200);
    }
}
