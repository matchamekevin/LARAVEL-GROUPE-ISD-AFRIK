<?php

namespace App\Filament\Resources\CategoriesProduits;

use App\Filament\Resources\CategoriesProduits\Pages\CreateCategorieProduit;
use App\Filament\Resources\CategoriesProduits\Pages\EditCategorieProduit;
use App\Filament\Resources\CategoriesProduits\Pages\ListCategoriesProduits;
use App\Filament\Resources\CategoriesProduits\Schemas\CategorieProduitForm;
use App\Filament\Resources\CategoriesProduits\Tables\CategoriesProduitsTable;
use App\Models\CategorieProduit;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class CategorieProduitResource extends Resource
{
    protected static ?string $model = CategorieProduit::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedTag;

    protected static \UnitEnum|string|null $navigationGroup = 'Catalogue';

    protected static ?string $navigationLabel = 'Catégories';
    protected static ?string $pluralLabel = 'Catégories';
    protected static ?string $modelLabel = 'Catégorie';

    public static function form(Schema $schema): Schema
    {
        return CategorieProduitForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CategoriesProduitsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCategoriesProduits::route('/'),
            'create' => CreateCategorieProduit::route('/create'),
            'edit' => EditCategorieProduit::route('/{record}/edit'),
        ];
    }
}
