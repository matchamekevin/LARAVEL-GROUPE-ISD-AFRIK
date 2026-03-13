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
    {Schema::create('archivages', function (Blueprint $table) {
        $table->bigIncrements('id_archivage');
        $table->string('archivable_type', 100);
        $table->bigInteger('archivable_id');
        $table->timestamp('date_archivage')->useCurrent();
        $table->string('raison', 255)->nullable();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('archivages');
    }
};
