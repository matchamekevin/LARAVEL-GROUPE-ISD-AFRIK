<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->bigIncrements('id_facture'); // PK
            $table->string('numero_facture', 50)->unique();
            $table->timestamp('date_facture')->useCurrent();
            $table->decimal('montant', 10, 2);

            // FK vers paiement (obligatoire)
            $table->unsignedBigInteger('id_paiement');
            $table->foreign('id_paiement')
                  ->references('id_paiement')
                  ->on('paiements')
                  ->onDelete('cascade');

            // Optionnel : rattacher à un pays (TVA, fiscalité)
            $table->unsignedBigInteger('id_pays')->nullable();
            $table->foreign('id_pays')
                  ->references('id_pays')
                  ->on('pays')
                  ->onDelete('set null');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
