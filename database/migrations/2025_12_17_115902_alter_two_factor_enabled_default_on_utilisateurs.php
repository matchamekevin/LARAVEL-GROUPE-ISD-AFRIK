<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->boolean('two_factor_enabled')->default(true)->change();
        });
    }

    public function down(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->boolean('two_factor_enabled')->default(false)->change();
        });
    }
};