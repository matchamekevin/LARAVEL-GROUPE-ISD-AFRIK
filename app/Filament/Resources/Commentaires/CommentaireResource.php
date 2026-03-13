<?php

namespace App\Filament\Resources\Commentaires;

use App\Filament\Resources\Commentaires\Pages\CreateCommentaire;
use App\Filament\Resources\Commentaires\Pages\EditCommentaire;
use App\Filament\Resources\Commentaires\Pages\ListCommentaires;
use App\Filament\Resources\Commentaires\Schemas\CommentaireForm;
use App\Filament\Resources\Commentaires\Tables\CommentairesTable;
use App\Models\Commentaire;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class CommentaireResource extends Resource
{
    protected static ?string $model = Commentaire::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChatBubbleLeftRight;

    protected static \UnitEnum|string|null $navigationGroup = 'Contenu';

    protected static ?string $navigationLabel = 'Commentaires';
    protected static ?string $pluralLabel = 'Commentaires';
    protected static ?string $modelLabel = 'Commentaire';

    /** 📄 Formulaire */
    public static function form(Schema $schema): Schema
    {
        return CommentaireForm::configure($schema);
    }

    /** 📊 Table */
    public static function table(Table $table): Table
    {
        return CommentairesTable::configure($table);
    }

    /** 🔗 Relations */
    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    /** 📌 Pages */
    public static function getPages(): array
    {
        return [
            'index' => ListCommentaires::route('/'),
            'create' => CreateCommentaire::route('/create'),
            'edit' => EditCommentaire::route('/{record}/edit'),
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