<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('form_mail_routes', function (Blueprint $table) {
            $table->id();
            $table->string('form_key', 120)->unique();
            $table->string('form_label', 255);
            $table->text('description')->nullable();
            $table->json('recipients');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('form_mail_routes')->insert([
            [
                'form_key' => 'contact_message',
                'form_label' => 'Formulaire de contact',
                'description' => 'Messages envoyes depuis la page Contact et avis de la page accueil.',
                'recipients' => json_encode(['support.clients@groupeisdafrik.com'], JSON_UNESCAPED_UNICODE),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'form_key' => 'devis_prestation',
                'form_label' => 'Demande de devis prestation',
                'description' => 'Demandes de devis envoyees depuis les pages prestations.',
                'recipients' => json_encode(['support.clients@groupeisdafrik.com'], JSON_UNESCAPED_UNICODE),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'form_key' => 'revendeur_demande',
                'form_label' => 'Formulaire Devenir vendeur',
                'description' => 'Demandes de partenariat revendeur.',
                'recipients' => json_encode([
                    'partenariats@groupeisdafrik.com',
                    'logistiques.partenariats@groupeisdafrik.com',
                ], JSON_UNESCAPED_UNICODE),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'form_key' => 'product_review',
                'form_label' => 'Avis produit',
                'description' => 'Avis laisses par les utilisateurs sur les fiches produit.',
                'recipients' => json_encode(['support.clients@groupeisdafrik.com'], JSON_UNESCAPED_UNICODE),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_mail_routes');
    }
};
