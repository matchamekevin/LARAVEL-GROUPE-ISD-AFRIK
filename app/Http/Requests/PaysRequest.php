<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * PaysRequest
 * Valide les données envoyées pour créer ou mettre à jour un pays.
 */
class PaysRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Si c'est une création (POST), on impose l'unicité du code_pays
        // Si c'est une mise à jour (PUT/PATCH), on ignore l'ID actuel
        $id = $this->route('id'); // récupère l'ID du pays dans l'URL

        return [
            'nom_pays'          => ['required', 'string', 'max:150'],
            'code_pays'         => [
                'required',
                'string',
                'max:10',
                'unique:pays,code_pays' . ($id ? ',' . $id . ',id_pays' : '')
            ],
            'devise_locale'     => ['nullable', 'string', 'max:50'],
            'langue_principale' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'nom_pays.required'   => 'Le nom du pays est obligatoire.',
            'code_pays.required'  => 'Le code du pays est obligatoire.',
            'code_pays.unique'    => 'Ce code pays existe déjà dans la base.',
            'devise_locale.max'   => 'La devise ne peut pas dépasser 50 caractères.',
            'langue_principale.max' => 'La langue ne peut pas dépasser 50 caractères.',
        ];
    }
}