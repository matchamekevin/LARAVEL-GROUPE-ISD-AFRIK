<?php

namespace Database\Seeders;

use App\Models\Produit;
use Illuminate\Database\Seeder;

class UpdateProduitImagesSeeder extends Seeder
{
    public function run(): void
    {
        // Set a sensible default image for existing products missing an image_url
        $default = '/images/default.jpg';

        Produit::query()
            ->whereNull('image_url')
            ->orWhere('image_url', '')
            ->update(['image_url' => $default]);
    }
}
