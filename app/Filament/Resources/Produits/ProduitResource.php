<?php

namespace App\Filament\Resources\Produits;

use App\Filament\Resources\Produits\Pages\CreateProduit;
use App\Filament\Resources\Produits\Pages\EditProduit;
use App\Filament\Resources\Produits\Pages\ListProduits;
use App\Filament\Resources\Produits\Schemas\ProduitForm;
use App\Filament\Resources\Produits\Tables\ProduitsTable;
use App\Models\Produit;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class ProduitResource extends Resource
{

    protected static ?string $model = Produit::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static \UnitEnum|string|null $navigationGroup = 'Catalogue';

    protected static ?string $navigationLabel = 'Produits';
    protected static ?string $pluralLabel = 'Produits';
    protected static ?string $modelLabel = 'Produit';

    /** 📄 Formulaire */
    public static function form(Schema $schema): Schema
    {
        return ProduitForm::configure($schema);
    }

    /** 📊 Table */
    public static function table(Table $table): Table
    {
        return ProduitsTable::configure($table);
    }

    /** 🔗 Relations */
    public static function getRelations(): array
    {
        return [
            // RelationManagers à venir si besoin
        ];
    }

    /** 📌 Pages */
    public static function getPages(): array
    {
        return [
            'index' => ListProduits::route('/'),
            'create' => CreateProduit::route('/create'),
            'edit' => EditProduit::route('/{record}/edit'),
        ];
    }

    /** 🗑️ SoftDeletes (évite les 404) */
    public static function getRecordRouteBindingEloquentQuery(): Builder
    {
        return parent::getRecordRouteBindingEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }
}
