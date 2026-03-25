<?php

namespace Database\Factories;

use App\Models\Pays;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $firstName = fake()->firstName();
        $lastName = fake()->lastName();

        $countryId = Pays::query()->value('id_pays');
        if (!$countryId) {
            $countryId = Pays::query()->insertGetId([
                'nom_pays' => 'Togo',
                'code_pays' => '+228',
                'devise_locale' => 'XOF',
                'langue_principale' => 'fr',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_pays');
        }

        $data = [
            'nom' => $lastName,
            'prenom' => $firstName,
            'email' => fake()->unique()->safeEmail(),
            'telephone' => fake()->numerify('9#######'),
            'mot_de_passe' => static::$password ??= Hash::make('password'),
            'role' => 'client',
            'is_admin' => false,
            'admin_role' => 'client',
            'statut' => 'actif',
            'can_access_client' => true,
            'can_access_admin' => false,
            'id_pays' => $countryId,
            'remember_token' => Str::random(10),
            'date_creation' => now(),
        ];

        if (Schema::hasColumn('utilisateurs', 'uuid')) {
            $data['uuid'] = (string) Str::uuid();
        }

        return $data;
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        // No-op: la table utilisateurs ne porte pas le champ email_verified_at.
        return $this->state(fn (array $attributes) => []);
    }
}
