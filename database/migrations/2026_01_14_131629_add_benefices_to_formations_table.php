<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('formations', 'benefices')) {
            Schema::table('formations', function (Blueprint $table) {
                $table->text('benefices')->nullable()->after('description');
            });
        }
    }

    public function down(): void
    {
        Schema::table('formations', function (Blueprint $table) {
            $table->dropColumn('benefices');
        });
    }
};