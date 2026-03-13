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
        Schema::create('suivi_techniques', function (Blueprint $table) {
            $table->bigIncrements('id_suivi');
            $table->string('type', 50);
            $table->text('message');
            $table->string('niveau', 20)->default('info');
            $table->timestamp('date_log')->useCurrent();
            $table->unsignedBigInteger('id_utilisateur')->nullable();
        
            $table->foreign('id_utilisateur')->references('id_utilisateur')->on('utilisateurs')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suivi_techniques');
    }
};
