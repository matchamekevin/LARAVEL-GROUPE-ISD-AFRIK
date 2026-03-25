<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImageRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $rawType = $this->input('imageable_type');
        if (!is_string($rawType) || trim($rawType) === '') {
            return;
        }

        $normalized = strtoupper(trim($rawType));
        $map = [
            'APP\\MODELS\\PRODUIT' => 'PRODUIT',
            'APP\\MODELS\\FORMATION' => 'FORMATION',
            'APP\\MODELS\\BLOG' => 'BLOG',
            'APP\\MODELS\\CATEGORIEPRODUIT' => 'CATEGORY',
        ];

        $this->merge([
            'imageable_type' => $map[$normalized] ?? $normalized,
        ]);
    }

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
            'imageable_type' => 'required|string|in:PRODUIT,FORMATION,BLOG,CATEGORY',
            'imageable_id'   => 'required|integer',
        ];
    }

    public function messages(): array
    {
        return [
            'url.required'          => 'Le champ url est obligatoire.',
            'url.url'               => 'Le champ url doit être une URL valide.',
            'imageable_type.in'     => 'Le type doit être PRODUIT, FORMATION, BLOG ou CATEGORY.',
            'imageable_id.required' => 'L’ID de l’entité liée est obligatoire.',
            'imageable_id.integer'  => 'L’ID doit être un entier.',
        ];
    }
}