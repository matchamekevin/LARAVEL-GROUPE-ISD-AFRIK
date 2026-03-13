<?php

namespace App\Filament\Resources\Images;

use App\Filament\Resources\Images\Pages\CreateImage;
use App\Filament\Resources\Images\Pages\EditImage;
use App\Filament\Resources\Images\Pages\ListImages;
use App\Filament\Resources\Images\Schemas\ImageForm;
use App\Filament\Resources\Images\Tables\ImagesTable;
use App\Models\Image;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class ImageResource extends Resource
{
    protected static ?string $model = Image::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedPhoto;

    protected static \UnitEnum|string|null $navigationGroup = 'Médias';

    protected static ?string $navigationLabel = 'Images';
    protected static ?string $pluralLabel = 'Images';
    protected static ?string $modelLabel = 'Image';

    /** 📄 Formulaire */
    public static function form(Schema $schema): Schema
    {
        return ImageForm::configure($schema);
    }

    /** 📊 Table */
    public static function table(Table $table): Table
    {
        return ImagesTable::configure($table);
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
            'index' => ListImages::route('/'),
            'create' => CreateImage::route('/create'),
            'edit' => EditImage::route('/{record}/edit'),
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