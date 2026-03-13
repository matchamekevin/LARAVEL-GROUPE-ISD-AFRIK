<?php

namespace App\Filament\Resources\Utilisateurs;

use App\Filament\Resources\Utilisateurs\Pages\CreateUtilisateur;
use App\Filament\Resources\Utilisateurs\Pages\EditUtilisateur;
use App\Filament\Resources\Utilisateurs\Pages\ListUtilisateurs;
use App\Filament\Resources\Utilisateurs\Pages\ViewUtilisateur;
use App\Filament\Resources\Utilisateurs\Schemas\UtilisateurForm;
use App\Filament\Resources\Utilisateurs\Schemas\UtilisateurInfolist;
use App\Filament\Resources\Utilisateurs\Tables\UtilisateursTable;
use App\Models\Utilisateur;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class UtilisateurResource extends Resource
{
    protected static ?string $model = Utilisateur::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'nom';

    public static function form(Schema $schema): Schema
    {
        return UtilisateurForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return UtilisateurInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return UtilisateursTable::configure($table);
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
            'index' => ListUtilisateurs::route('/'),
            'create' => CreateUtilisateur::route('/create'),
            'view' => ViewUtilisateur::route('/{record}'),
            'edit' => EditUtilisateur::route('/{record}/edit'),
        ];
    }

    public static function getRecordRouteBindingEloquentQuery(): Builder
    {
        return parent::getRecordRouteBindingEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
{
    $query = parent::getEloquentQuery()
        ->withoutGlobalScopes([SoftDeletingScope::class]);

    $user = auth()->user();

    if ($user && $user->isAdminPays()) {
        // Admin Pays → limité à son pays
        $query->where('id_pays', $user->id_pays);
    }
    // Super Admin → pas de filtre, accès global

    return $query;
}
}
