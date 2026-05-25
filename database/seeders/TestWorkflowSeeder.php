<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TestWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure a pays exists
        $paysId = DB::table('pays')->value('id_pays');
        if (!$paysId) {
            $paysId = (string) Str::uuid();
            DB::table('pays')->insert([
                'id_pays' => $paysId,
                'nom_pays' => 'Test',
                'code_pays' => 'XX',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Ensure a product exists
        $produitId = DB::table('produits')->value('id_produit');
        if (!$produitId) {
            $produitId = (string) Str::uuid();
            $catId = DB::table('categories_produits')->value('id_categorie');
            DB::table('produits')->insert([
                'id_produit' => $produitId,
                'titre' => 'Test Product',
                'slug' => 'test-product-'.uniqid(),
                'description' => 'Test',
                'prix' => 100,
                'id_categorie' => $catId,
                'id_pays' => $paysId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 1. Créer un utilisateur de test
        $userId = (string) Str::uuid();
        DB::table('utilisateurs')->insert([
            'id_utilisateur' => $userId,
            'nom' => 'Test',
            'prenom' => 'User',
            'email' => 'test_'.uniqid().'@example.com',
            'telephone' => '90000001',
            'mot_de_passe' => bcrypt('password'),
            'admin_role' => 'client',
            'is_admin' => false,
            'statut' => 'actif',
            'can_access_client' => true,
            'can_access_admin' => false,
            'two_factor_enabled' => false,
            'id_pays' => $paysId,
            'remember_token' => null,
            'last_login' => null,
            'date_creation' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // 2. Créer une commande
        $commandeId = (string) Str::uuid();
        DB::table('commandes')->insert([
            'id_commande' => $commandeId,
            'numero_commande' => 'CMD-'.uniqid(),
            'date_commande' => Carbon::now(),
            'statut' => 'en_attente',
            'montant_total' => 150.00,
            'montant_commission' => null,
            'date_livraison' => null,
            'id_utilisateur' => $userId,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // 3. Ajouter une ligne de commande (produit uniquement)
        $ligneId = (string) Str::uuid();
        DB::table('ligne_commandes')->insert([
            'id_ligne' => $ligneId,
            'id_commande' => $commandeId,
            'id_produit' => $produitId,
            'quantite' => 1,
            'prix_unitaire' => 150.00,
            'sous_total' => 150.00,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // 4. Créer un paiement
        $paiementId = (string) Str::uuid();
        DB::table('paiements')->insert([
            'id_paiement' => $paiementId,
            'reference_transaction' => 'TX-'.uniqid(),
            'moyen_paiement' => 'CinetPay',
            'statut_paiement' => 'réussi',
            'montant' => 150.00,
            'date_paiement' => Carbon::now(),
            'id_commande' => $commandeId,
            'id_utilisateur' => $userId,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // 5. Générer une facture
        $factureId = (string) Str::uuid();
        DB::table('factures')->insert([
            'id_facture' => $factureId,
            'numero_facture' => 'FAC-'.uniqid(),
            'date_facture' => Carbon::now(),
            'montant' => 150.00,
            'id_paiement' => $paiementId,
            'id_pays' => null,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
    }
}
