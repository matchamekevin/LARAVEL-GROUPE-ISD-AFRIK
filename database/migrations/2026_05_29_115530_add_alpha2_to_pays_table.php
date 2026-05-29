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
        Schema::table('pays', function (Blueprint $table) {
            $table->string('alpha2', 2)->nullable()->unique()->after('code_pays');
        });

        DB::table('pays')->where('nom_pays', 'Togo')->update(['alpha2' => 'TG']);
    }

    public function down(): void
    {
        Schema::table('pays', function (Blueprint $table) {
            $table->dropColumn('alpha2');
        });
    }
};
