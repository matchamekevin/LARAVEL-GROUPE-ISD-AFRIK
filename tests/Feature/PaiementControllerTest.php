<?php

use App\Models\Formation;
use App\Models\Paiement;
use App\Models\Pays;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('returns a clear error when fedapay config is missing', function () {
    $pays = Pays::query()->create([
        'nom_pays' => 'Togo',
        'code_pays' => '+'.(string) random_int(100, 999).(string) random_int(100, 999),
        'devise_locale' => 'XOF',
        'langue_principale' => 'fr',
    ]);

    $user = User::factory()->create();

    $formation = Formation::query()->create([
        'titre' => 'Formation test',
        'prix' => 50000,
        'id_pays' => $pays->id_pays,
    ]);

    config()->set('services.fedapay.secret', null);
    config()->set('services.fedapay.callback_url', null);

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/formations/'.$formation->id_formation.'/paiement');

    $response
        ->assertServerError()
        ->assertJson([
            'message' => 'Configuration FedaPay manquante ❌',
        ]);
});

it('auto-generates uuid on paiement creation', function () {
    $user = User::factory()->create();

    $paiement = Paiement::query()->create([
        'reference_transaction' => 'TX-'.uniqid(),
        'moyen_paiement' => 'fedapay',
        'statut_paiement' => 'en_attente',
        'montant' => 50000,
        'date_paiement' => now(),
        'id_utilisateur' => $user->id_utilisateur,
    ]);

    expect($paiement->uuid)->toBeString()->not->toBe('');
});
