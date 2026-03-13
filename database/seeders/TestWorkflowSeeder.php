<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TestWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Créer un utilisateur de test
        $userId = DB::table('utilisateurs')->insertGetId([
            'nom'                => 'Test',
            'prenom'             => 'User',
            'email'              => 'test_' . uniqid() . '@example.com',
            'telephone'          => '90000001',
            'mot_de_passe'       => bcrypt('password'),
            'role'               => 'user',
            'is_admin'           => false,
            'statut'             => true,
            'two_factor_enabled' => false,
            'id_pays'            => null,
            'remember_token'     => null,
            'admin_role'         => 'user',
            'last_login'         => null,
            'date_creation'      => Carbon::now(),
            'created_at'         => Carbon::now(),
            'updated_at'         => Carbon::now(),
        ], 'id_utilisateur');

        // 2. Créer une commande
        $commandeId = DB::table('commandes')->insertGetId([
            'numero_commande'    => 'CMD-' . uniqid(),
            'date_commande'      => Carbon::now(),
            'statut'             => 'en_attente',
            'montant_total'      => 150.00,
            'montant_commission' => null,
            'date_livraison'     => null,
            'id_utilisateur'     => $userId,
            'created_at'         => Carbon::now(),
            'updated_at'         => Carbon::now(),
        ], 'id_commande');

        // 3. Ajouter une ligne de commande (produit uniquement)
        $ligneId = DB::table('lignes_commandes')->insertGetId([
            'id_commande'   => $commandeId,
            'id_produit'    => 1,   // ⚡ suppose que tu as un produit avec id=1
            'quantite'      => 1,
            'prix_unitaire' => 150.00,
            'sous_total'    => 150.00,
            'created_at'    => Carbon::now(),
            'updated_at'    => Carbon::now(),
        ], 'id_ligne');

        // 4. Créer un paiement
        $paiementId = DB::table('paiements')->insertGetId([
            'reference_transaction' => 'TX-' . uniqid(),
            'moyen_paiement'        => 'CinetPay',
            'statut_paiement'       => 'réussi',
            'montant'               => 150.00,
            'date_paiement'         => Carbon::now(),
            'id_commande'           => $commandeId,
            'created_at'            => Carbon::now(),
            'updated_at'            => Carbon::now(),
        ], 'id_paiement');

        // 5. Générer une facture
        $factureId = DB::table('factures')->insertGetId([
            'numero_facture' => 'FAC-' . uniqid(),
            'date_facture'   => Carbon::now(),
            'montant'        => 150.00,
            'id_paiement'    => $paiementId,
            'id_pays'        => null,
            'created_at'     => Carbon::now(),
            'updated_at'     => Carbon::now(),
        ], 'id_facture');
    }
}
