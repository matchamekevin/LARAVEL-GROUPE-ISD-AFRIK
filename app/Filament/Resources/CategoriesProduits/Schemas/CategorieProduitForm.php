<?php

namespace App\Filament\Resources\CategoriesProduits\Schemas;

use App\Models\CategorieProduit;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\FileUpload;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class CategorieProduitForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('nom')
                ->required()
                ->maxLength(255)
                ->live(onBlur: true)
                ->afterStateUpdated(fn ($state, callable $set) => $set('slug', Str::slug($state))),

            TextInput::make('slug')
                ->required()
                ->maxLength(160)
                ->unique(CategorieProduit::class, 'slug', ignoreRecord: true),

            Select::make('parent_id')
                ->label('Catégorie Parente')
                ->options(CategorieProduit::getTreeOptions())
                ->searchable()
                ->placeholder('Aucune (Racine)')
                ->hint('Choisissez une sous-catégorie pour créer un niveau supplémentaire.'),

            Select::make('display_mode')
                ->label('Mode d\'affichage')
                ->options([
                    'auto' => 'Auto (enfants ou produits selon la configuration)',
                    'children' => 'Toujours afficher les sous-catégories',
                    'products' => 'Toujours afficher les produits',
                ])
                ->default('auto')
                ->hint('Contrôle si la catégorie doit afficher des sous-catégories ou directement des produits.'),

            Select::make('segment')
                ->options([
                    'general' => 'Catalogue Général',
                    'geovision' => 'GeoVision',
                    'ingenierie-page' => 'Ingénierie Page',
                ])
                ->default('general')
                ->required(),

            Textarea::make('description')
                ->rows(3)
                ->maxLength(1000),

            TextInput::make('icone')
                ->label('Icône (Heroicon)')
                ->placeholder('Ex: outlined.academic-cap'),

            FileUpload::make('image')
                ->image()
                ->directory('categories-produits')
                ->maxSize(5120),

            TextInput::make('ordre')
                ->numeric()
                ->default(0),

            Toggle::make('actif')
                ->label('Actif')
                ->default(true),
        ]);
    }
}
