<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\CategorieProduit;
use App\Models\Pays;

/**
 * ProduitRequest
 *
 * Valide les données d'entrée pour la création et la mise à jour d'un produit.
 * - S'applique aux endpoints store/update du ProduitController.
 * - Centralise les règles pour garantir la cohérence métier et technique.
 *
 * Remarques de conception :
 * - Le champ 'statut' est optionnel mais limité à 'disponible' ou 'indisponible'.
 * - Le champ 'titre' est utilisé comme nom principal du produit.
 * - La clé étrangère vers 'pays' utilise la colonne 'id_pays' (confirmée dans la migration).
 * - Le champ 'date_creation' peut être fourni, sinon il est généré automatiquement.
 */
class ProduitRequest extends FormRequest
{
    /**
     * Autorisation
     *
     * Autorise la requête. À restreindre si tu ajoutes des règles d'accès (ex: policies).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Règles de validation
     *
     * - titre: requis, chaîne courte (<=200)
     * - description: optionnelle, texte libre
     * - prix: requis, numérique, non négatif
     * - statut: optionnel, valeurs contrôlées
     * - date_creation: optionnelle, doit être une date valide
     * - id_pays: requis, entier, doit exister dans la table 'pays' (colonne 'id_pays')
     */
    public function rules(): array
{
    return [
        'titre'              => 'required|string|max:200',
        'description'        => 'nullable|string',
        'description_courte' => 'nullable|string',
        'prix'               => 'required|numeric|min:0',
        'prix_promo'         => 'nullable|numeric|min:0',
        'promo_debut'        => 'nullable|date',
        'promo_fin'          => 'nullable|date',
        'stock'              => 'nullable|integer|min:0',
        'stock_alerte'       => 'nullable|integer|min:0',
        'statut'             => 'nullable|string|in:disponible,indisponible',
        'date_creation'      => 'nullable|date',
        'id_categorie'       => 'required|integer|exists:categories_produits,id_categorie',
        'id_pays'            => 'required|integer|exists:pays,id_pays',
        'id_utilisateur'     => 'nullable|integer|exists:utilisateurs,id_utilisateur',

        // Champs qui posaient problème
        'marque'             => 'nullable|string|max:255',
        'modele'             => 'nullable|string|max:255',
        'poids'              => 'nullable|numeric|min:0',
        'specifications'     => 'nullable|array',
        'garantie'           => 'nullable|string|max:255',
        'est_en_vedette'     => 'boolean',
        'est_nouveau'        => 'boolean',
        'en_promo'           => 'boolean',
        'slug'               => 'nullable|string|max:255',
    ];
}

    protected function prepareForValidation(): void
    {
        $idCategorie = $this->input('id_categorie');
        $idPays = $this->input('id_pays');

        if (empty($idCategorie)) {
            $idCategorie = CategorieProduit::query()->value('id_categorie');
        }

        if (empty($idPays)) {
            $idPays = Pays::query()->value('id_pays');
        }

        $this->merge([
            'id_categorie' => $idCategorie,
            'id_pays' => $idPays,
        ]);
    }

    /**
     * Messages personnalisés
     *
     * Aide à renvoyer des erreurs plus explicites côté API/front.
     */
    public function messages(): array
    {
        return [
            'titre.required'     => 'Le titre du produit est obligatoire.',
            'titre.max'          => 'Le titre ne doit pas dépasser 200 caractères.',
            'prix.required'      => 'Le prix est obligatoire.',
            'prix.numeric'       => 'Le prix doit être une valeur numérique.',
            'prix.min'           => 'Le prix doit être supérieur ou égal à 0.',
            'statut.in'          => 'Le statut doit être "disponible" ou "indisponible".',
            'date_creation.date' => 'La date de création doit être une date valide.',
            'id_pays.required'   => 'Le pays est obligatoire.',
            'id_pays.integer'    => 'Le pays doit être un entier valide.',
            'id_pays.exists'     => 'Le pays spécifié est introuvable.',
        ];
    }
}