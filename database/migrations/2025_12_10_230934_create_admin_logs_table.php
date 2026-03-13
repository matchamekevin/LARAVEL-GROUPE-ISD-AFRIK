<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('admin_logs', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('admin_id');
        $table->string('action');
        $table->timestamps();

        // ⚠️ Adapter la clé étrangère selon ta vraie colonne primaire
        $table->foreign('admin_id')
              ->references('id_utilisateur') // ou 'id' si ta table a bien une colonne id
              ->on('utilisateurs')
              ->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_logs');
    }
};
