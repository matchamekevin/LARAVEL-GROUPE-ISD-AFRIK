<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function addColumnIfMissing(string $table, string $column, string $type, ?string $after = null): void
    {
        if (Schema::hasColumn($table, $column)) {
            return;
        }

        Schema::table($table, function (Blueprint $t) use ($column, $type, $after): void {
            $col = $type === 'longText'
                ? $t->longText($column)->nullable()
                : $t->string($column, 50)->nullable();

            if ($after) {
                $col->after($after);
            }
        });
    }

    public function up(): void
    {
        $this->addColumnIfMissing('utilisateurs', 'avatar_data', 'longText', 'avatar');
        $this->addColumnIfMissing('utilisateurs', 'avatar_mime', 'string', 'avatar_data');

        $this->addColumnIfMissing('images', 'image_data', 'longText', 'path');
        $this->addColumnIfMissing('images', 'image_mime', 'string', 'image_data');

        $this->addColumnIfMissing('home_marketing_cards', 'image_data', 'longText', 'image_path');
        $this->addColumnIfMissing('home_marketing_cards', 'image_mime', 'string', 'image_data');

        $this->addColumnIfMissing('home_testimonials', 'avatar_data', 'longText', 'avatar_path');
        $this->addColumnIfMissing('home_testimonials', 'avatar_mime', 'string', 'avatar_data');

        $this->addColumnIfMissing('home_collaborators', 'image_data', 'longText', 'image_path');
        $this->addColumnIfMissing('home_collaborators', 'image_mime', 'string', 'image_data');

        $this->addColumnIfMissing('home_partners', 'image_data', 'longText', 'image_path');
        $this->addColumnIfMissing('home_partners', 'image_mime', 'string', 'image_data');

        $this->addColumnIfMissing('home_geovision_sections', 'image_data', 'longText', 'image_path');
        $this->addColumnIfMissing('home_geovision_sections', 'image_mime', 'string', 'image_data');

        $this->addColumnIfMissing('categories_produits', 'image_data', 'longText', 'image_url');
        $this->addColumnIfMissing('categories_produits', 'image_mime', 'string', 'image_data');
    }

    public function down(): void
    {
        $columns = [
            'utilisateurs'             => ['avatar_data', 'avatar_mime'],
            'images'                   => ['image_data', 'image_mime'],
            'home_marketing_cards'     => ['image_data', 'image_mime'],
            'home_testimonials'        => ['avatar_data', 'avatar_mime'],
            'home_collaborators'       => ['image_data', 'image_mime'],
            'home_partners'            => ['image_data', 'image_mime'],
            'home_geovision_sections'  => ['image_data', 'image_mime'],
            'categories_produits'      => ['image_data', 'image_mime'],
        ];

        foreach ($columns as $table => $cols) {
            $existing = array_filter($cols, fn($c) => Schema::hasColumn($table, $c));

            if (!empty($existing)) {
                Schema::table($table, function (Blueprint $t) use ($existing): void {
                    $t->dropColumn($existing);
                });
            }
        }
    }
};
