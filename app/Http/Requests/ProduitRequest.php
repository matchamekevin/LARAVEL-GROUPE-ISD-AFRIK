<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\CategorieProduit;
use App\Models\Pays;
use Illuminate\Validation\Rule;

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
        $segment = $this->input('segment');
        $produitId = $this->route('id');

        $categoryRule = Rule::exists('categories_produits', 'id_categorie');
        if (!empty($segment)) {
            $categoryRule = $categoryRule->where(fn ($query) => $query->where('segment', $segment));
        }

        $referenceRules = ['nullable', 'string', 'max:100'];
        $slugRules = ['nullable', 'string', 'max:255'];

        $referenceRules[] = Rule::unique('produits', 'reference')->ignore($produitId, 'id_produit');
        $slugRules[] = Rule::unique('produits', 'slug')->ignore($produitId, 'id_produit');

        $geoVisionLeafCategoryRule = function ($attribute, $value, $fail) {
            $category = CategorieProduit::query()
                ->select(['id_categorie', 'segment', 'parent_id'])
                ->find($value);

            if (!$category) {
                return;
            }

            $requestedSegment = strtolower(trim((string) $this->input('segment', '')));
            $categorySegment = strtolower(trim((string) ($category->segment ?? '')));
            $isGeoVision = $requestedSegment === 'geovision' || $categorySegment === 'geovision';

            if (!$isGeoVision) {
                return;
            }

            $hasChildren = CategorieProduit::query()
                ->where('parent_id', $category->id_categorie)
                ->exists();

            if (empty($category->parent_id) || $hasChildren) {
                $fail('Pour GeoVision, veuillez choisir une sous-catégorie finale (pas une famille parent).');
            }
        };

        return [
        'titre'              => 'required|string|max:200',
        'reference'          => $referenceRules,
        'description'        => 'nullable|string',
        'description_courte' => 'nullable|string',
        'prix'               => 'required|numeric|min:0',
        'prix_promo'         => 'nullable|numeric|min:0',
        'promo_debut'        => 'nullable|date',
        'promo_fin'          => 'nullable|date',
        'stock'              => 'nullable|integer|min:0',
        'stock_alerte'       => 'nullable|integer|min:0',
        'statut'             => 'nullable|string|in:disponible,indisponible,rupture,actif',
        'date_creation'      => 'nullable|date',
        'id_categorie'       => ['required', 'integer', $categoryRule, $geoVisionLeafCategoryRule],
        'id_pays'            => 'required|integer|exists:pays,id_pays',
        'id_utilisateur'     => 'nullable|integer|exists:utilisateurs,id_utilisateur',
        'segment'            => 'nullable|string|in:general,geovision',

        // Champs qui posaient problème
        'marque'             => 'nullable|string|max:255',
        'modele'             => 'nullable|string|max:255',
        'poids'              => 'nullable|numeric|min:0',
        'specifications'     => 'nullable|array',
        'garantie'           => 'nullable|string|max:255',
        'est_en_vedette'     => 'boolean',
        'est_nouveau'        => 'boolean',
        'en_promo'           => 'boolean',
        'slug'               => $slugRules,
        'image_urls'         => 'nullable|array',
        'image_urls.*'       => 'nullable|string|max:255',
        'specifications.overview' => 'nullable|string',
        'specifications.tags' => 'nullable|array',
        'specifications.tags.*' => 'nullable|string|max:255',
        'specifications.features' => 'nullable|array',
        'specifications.features.*' => 'nullable|string|max:255',
        'specifications.platforms' => 'nullable|array',
        'specifications.platforms.*' => 'nullable|string|max:255',
        'specifications.use_cases' => 'nullable|array',
        'specifications.use_cases.*' => 'nullable|string|max:500',
        'specifications.detail_notes' => 'nullable|array',
        'specifications.detail_notes.*' => 'nullable|string|max:1000',
        'specifications.source_url' => 'nullable|string|max:1000',
        'specifications.technical_specs' => 'nullable|array',
        'specifications.technical_specs.*.label' => 'nullable|string|max:255',
        'specifications.technical_specs.*.value' => 'nullable|string|max:500',
        'specifications.taxonomy' => 'nullable|array',
        'specifications.taxonomy.family' => 'nullable|string|max:255',
        'specifications.taxonomy.category' => 'nullable|string|max:255',
        'specifications.taxonomy.subcategory' => 'nullable|string|max:255',
        'specifications.taxonomy.series' => 'nullable|string|max:255',
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
            'id_categorie.exists' => 'La catégorie sélectionnée ne correspond pas au segment du catalogue.',
            'reference.unique'   => 'Cette référence produit existe déjà.',
            'slug.unique'        => 'Ce slug produit existe déjà.',
        ];
    }
}
