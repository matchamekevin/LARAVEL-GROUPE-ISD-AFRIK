<?php

namespace App\Services;

use App\Models\FormMailRoute;
use Illuminate\Support\Facades\Schema;

class FormMailRouteService
{
    public const FORM_CONTACT_MESSAGE = 'contact_message';
    public const FORM_DEVIS_PRESTATION = 'devis_prestation';
    public const FORM_REVENDEUR_DEMANDE = 'revendeur_demande';
    public const FORM_PRODUCT_REVIEW = 'product_review';
    public const FORM_NEWSLETTER = 'newsletter';

    /**
     * @return array<string, array{form_key: string, form_label: string, description: string, recipients: array<int, string>, is_active: bool}>
     */
    public function defaults(): array
    {
        return [
            self::FORM_CONTACT_MESSAGE => [
                'form_key' => self::FORM_CONTACT_MESSAGE,
                'form_label' => 'Formulaire de contact',
                'description' => 'Messages envoyes depuis la page Contact et avis de la page accueil.',
                'recipients' => ['support.clients@groupeisdafrik.com'],
                'is_active' => true,
            ],
            self::FORM_DEVIS_PRESTATION => [
                'form_key' => self::FORM_DEVIS_PRESTATION,
                'form_label' => 'Demande de devis prestation',
                'description' => 'Demandes de devis envoyees depuis les pages prestations.',
                'recipients' => ['support.clients@groupeisdafrik.com'],
                'is_active' => true,
            ],
            self::FORM_REVENDEUR_DEMANDE => [
                'form_key' => self::FORM_REVENDEUR_DEMANDE,
                'form_label' => 'Formulaire Devenir vendeur',
                'description' => 'Demandes de partenariat revendeur.',
                'recipients' => [
                    'partenariats@groupeisdafrik.com',
                    'logistiques.partenariats@groupeisdafrik.com',
                ],
                'is_active' => true,
            ],
            self::FORM_PRODUCT_REVIEW => [
                'form_key' => self::FORM_PRODUCT_REVIEW,
                'form_label' => 'Avis produit',
                'description' => 'Avis laisses par les utilisateurs sur les fiches produit.',
                'recipients' => ['support.clients@groupeisdafrik.com'],
                'is_active' => true,
            ],
            self::FORM_NEWSLETTER => [
                'form_key' => self::FORM_NEWSLETTER,
                'form_label' => 'Inscription newsletter',
                'description' => 'Notifications lors des nouvelles inscriptions a la newsletter.',
                'recipients' => ['support.clients@groupeisdafrik.com'],
                'is_active' => true,
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(): array
    {
        $defaults = $this->defaults();

        if (! Schema::hasTable('form_mail_routes')) {
            return array_values($defaults);
        }

        $dbRows = FormMailRoute::query()->orderBy('form_label')->get();

        foreach ($dbRows as $row) {
            $key = (string) $row->form_key;

            $defaults[$key] = [
                'id' => $row->id,
                'form_key' => $key,
                'form_label' => (string) $row->form_label,
                'description' => (string) ($row->description ?? ''),
                'recipients' => $this->sanitizeEmails($row->recipients),
                'is_active' => (bool) $row->is_active,
                'created_at' => optional($row->created_at)?->toDateTimeString(),
                'updated_at' => optional($row->updated_at)?->toDateTimeString(),
            ];
        }

        return array_values($defaults);
    }

    /**
     * @return array<int, string>
     */
    public function recipientsFor(string $formKey): array
    {
        if (Schema::hasTable('form_mail_routes')) {
            $record = FormMailRoute::query()->where('form_key', $formKey)->first();

            if ($record) {
                if (! $record->is_active) {
                    return [];
                }

                return $this->sanitizeEmails($record->recipients);
            }
        }

        $defaults = $this->defaults();
        $fallback = $defaults[$formKey] ?? null;

        if (! $fallback || ! ($fallback['is_active'] ?? true)) {
            return [];
        }

        return $this->sanitizeEmails($fallback['recipients'] ?? []);
    }

    /**
     * @param array<int, string>|string $recipientsInput
     */
    public function upsert(string $formKey, string $formLabel, ?string $description, array|string $recipientsInput, bool $isActive = true): FormMailRoute
    {
        if (! Schema::hasTable('form_mail_routes')) {
            throw new \RuntimeException('Table form_mail_routes introuvable. Lancez les migrations.');
        }

        $recipients = is_array($recipientsInput)
            ? $this->sanitizeEmails($recipientsInput)
            : $this->parseEmailsString($recipientsInput);

        return FormMailRoute::query()->updateOrCreate(
            ['form_key' => $formKey],
            [
                'form_label' => $formLabel,
                'description' => $description,
                'recipients' => $recipients,
                'is_active' => $isActive,
            ]
        );
    }

    /**
     * @param array<int, mixed>|null $emails
     * @return array<int, string>
     */
    public function sanitizeEmails(?array $emails): array
    {
        $clean = [];

        foreach ((array) $emails as $email) {
            $value = strtolower(trim((string) $email));
            if ($value === '' || ! filter_var($value, FILTER_VALIDATE_EMAIL)) {
                continue;
            }
            $clean[$value] = $value;
        }

        return array_values($clean);
    }

    /**
     * @return array<int, string>
     */
    public function parseEmailsString(?string $value): array
    {
        $parts = preg_split('/[\s,;]+/', (string) $value) ?: [];
        return $this->sanitizeEmails($parts);
    }
}
