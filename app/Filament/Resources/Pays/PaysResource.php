<?php

namespace App\Filament\Resources\Pays;

use App\Filament\Resources\Pays\Pages\CreatePays;
use App\Filament\Resources\Pays\Pages\EditPays;
use App\Filament\Resources\Pays\Pages\ListPays;
use App\Filament\Resources\Pays\Pages\ViewPays;
use App\Filament\Resources\Pays\Schemas\PaysForm;
use App\Filament\Resources\Pays\Tables\PaysTable;
use App\Models\Pays;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class PaysResource extends Resource
{
    protected static ?string $model = Pays::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedGlobeAlt;

    protected static \UnitEnum|string|null $navigationGroup = 'Configuration';

    protected static ?string $navigationLabel = 'Pays';
    protected static ?string $pluralLabel = 'Pays';
    protected static ?string $modelLabel = 'Pays';

    protected static ?string $recordTitleAttribute = 'nom_pays';

    /** 📄 Formulaire */
    public static function form(Schema $schema): Schema
    {
        return PaysForm::configure($schema);
    }

    /** 📊 Table */
    public static function table(Table $table): Table
    {
        return PaysTable::configure($table);
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
            'index' => ListPays::route('/'),
            'create' => CreatePays::route('/create'),
            'view' => ViewPays::route('/{record}'),
            'edit' => EditPays::route('/{record}/edit'),
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