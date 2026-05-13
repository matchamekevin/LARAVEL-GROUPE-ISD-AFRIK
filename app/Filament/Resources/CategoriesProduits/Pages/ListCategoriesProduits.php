<?php

namespace App\Filament\Resources\CategoriesProduits\Pages;

use App\Filament\Resources\CategoriesProduits\CategorieProduitResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCategoriesProduits extends ListRecords
{
    protected static string $resource = CategorieProduitResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
