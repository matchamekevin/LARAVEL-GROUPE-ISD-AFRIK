<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id_log');
            $table->string('action', 100);
            $table->string('table_cible', 100);
            $table->bigInteger('id_cible')->nullable();
            $table->jsonb('donnees_avant')->nullable();
            $table->jsonb('donnees_apres')->nullable();
            $table->timestamp('date_action')->useCurrent();
            $table->unsignedBigInteger('id_utilisateur')->nullable();
        
            $table->foreign('id_utilisateur')->references('id_utilisateur')->on('utilisateurs')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
