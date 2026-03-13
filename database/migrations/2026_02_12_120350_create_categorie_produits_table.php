<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('categorie_produits')) {
            Schema::create('categorie_produits', function (Blueprint $table) {
                $table->bigIncrements('id_categorie');
                $table->string('nom', 200);
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('categorie_produits');
    }
};