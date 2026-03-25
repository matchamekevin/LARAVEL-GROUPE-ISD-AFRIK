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
        Schema::create('home_marketing_cards', function (Blueprint $table) {
            $table->id();
            $table->string('section', 32); // offer | featured_product
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('badge_text')->nullable();
            $table->string('meta_text')->nullable();
            $table->string('cta_label')->nullable();
            $table->string('target_url')->nullable();
            $table->string('image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['section', 'is_active', 'sort_order'], 'home_marketing_cards_section_active_order_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('home_marketing_cards');
    }
};
