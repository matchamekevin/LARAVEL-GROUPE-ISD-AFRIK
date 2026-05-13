<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('authenticates with case-insensitive email on api login', function () {
    $user = User::factory()->create([
        'email' => 'Client.Test@example.com',
        'two_factor_enabled' => false,
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => '  client.test@EXAMPLE.com  ',
        'mot_de_passe' => 'password',
        'portal' => 'client',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('requires_2fa', false);
});

it('authenticates legacy plaintext password and upgrades it to hash', function () {
    $plainPassword = 'secret123';

    $user = User::factory()->create([
        'mot_de_passe' => $plainPassword,
        'two_factor_enabled' => false,
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'mot_de_passe' => $plainPassword,
        'portal' => 'client',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('requires_2fa', false);

    $user->refresh();

    expect($user->mot_de_passe)
        ->not->toBe($plainPassword)
        ->and(Hash::check($plainPassword, $user->mot_de_passe))->toBeTrue();
});
