<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'url'            => 'required|url|max:255',
            'path'           => 'nullable|string|max:255',
            'alt'            => 'nullable|string|max:255',
            // Ici on valide uniquement les alias simples
            'imageable_type' => 'required|string|in:PRODUIT,FORMATION,BLOG',
            'imageable_id'   => 'required|integer',
        ];
    }

    public function messages(): array
    {
        return [
            'url.required'          => 'Le champ url est obligatoire.',
            'url.url'               => 'Le champ url doit être une URL valide.',
            'imageable_type.in'     => 'Le type doit être PRODUIT, FORMATION ou BLOG.',
            'imageable_id.required' => 'L’ID de l’entité liée est obligatoire.',
            'imageable_id.integer'  => 'L’ID doit être un entier.',
        ];
    }

    /**
     * Mapping automatique des alias vers les classes Laravel
     */
    protected function passedValidation()
    {
        $map = [
            'PRODUIT'   => 'App\\Models\\Produit',
            'FORMATION' => 'App\\Models\\Formation',
            'BLOG'      => 'App\\Models\\Blog',
        ];

        if (isset($this->imageable_type) && isset($map[$this->imageable_type])) {
            $this->merge([
                'imageable_type' => $map[$this->imageable_type],
            ]);
        }
    }
}