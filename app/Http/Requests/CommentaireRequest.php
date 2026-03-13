<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * CommentaireRequest
 * Gère la validation et l'autorisation des requêtes liées aux commentaires.
 */
class CommentaireRequest extends FormRequest
{
    /**
     * Autorisation de la requête.
     * ⚠️ IMPORTANT : si tu laisses "false", Laravel renvoie 403 Forbidden.
     */
    public function authorize(): bool
    {
        return true; // ✅ Autorise toutes les requêtes pour le moment
    }

    /**
     * Règles de validation pour les champs du commentaire.
     */
    public function rules(): array
    {
        return [
            'contenu'          => 'required|string|min:3|max:1000',
            'note'             => 'nullable|integer|min:1|max:5',
            'date'             => 'nullable|date',
            'commentable_type' => 'required|string|in:PRODUIT,FORMATION,BLOG',
            'commentable_id'   => 'required|integer|exists:produits,id_produit', 
            // ⚠️ adapte "produits,id_produit" selon la table cible
            'id_utilisateur'   => 'required|integer|exists:utilisateurs,id_utilisateur',
        ];
    }

    /**
     * Messages personnalisés pour les erreurs de validation.
     */
    public function messages(): array
    {
        return [
            'contenu.required' => 'Le contenu du commentaire est obligatoire.',
            'contenu.min'      => 'Le commentaire doit contenir au moins 3 caractères.',
            'note.integer'     => 'La note doit être un nombre entier.',
            'note.min'         => 'La note minimale est 1.',
            'note.max'         => 'La note maximale est 5.',
            'commentable_type.in' => 'Le type doit être PRODUIT, FORMATION ou BLOG.',
            'commentable_id.exists' => 'L’élément commenté n’existe pas.',
            'id_utilisateur.exists' => 'L’utilisateur n’existe pas.',
        ];
    }
}