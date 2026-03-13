<?php

namespace App\Filament\Resources\Images\Schemas;

use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\TextInput;
use Filament\Schemas\Components\FileUpload;
use Filament\Schemas\Components\Select;
use Filament\Schemas\Schema;

class ImageForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Image')
                    ->schema([
                        FileUpload::make('url')
                            ->label('Image')
                            ->image()
                            ->required()
                            ->directory('images')
                            ->visibility('public')
                            ->maxSize(5120) // 5MB
                            ->imageEditor()
                            ->columnSpanFull(),

                        TextInput::make('alt')
                            ->label('Texte alternatif')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Description de l\'image pour l\'accessibilité'),

                        TextInput::make('path')
                            ->label('Chemin personnalisé (optionnel)')
                            ->maxLength(255)
                            ->placeholder('Laissez vide pour auto-génération'),
                    ])
                    ->columns(1),

                Section::make('Association')
                    ->schema([
                        Select::make('imageable_type')
                            ->label('Type d\'élément')
                            ->options([
                                'App\\Models\\Produit' => 'Produit',
                                'App\\Models\\Formation' => 'Formation',
                                'App\\Models\\Blog' => 'Blog',
                            ])
                            ->required()
                            ->reactive(),

                        TextInput::make('imageable_id')
                            ->label('ID de l\'élément')
                            ->required()
                            ->numeric()
                            ->minValue(1),
                    ])
                    ->columns(2),
            ]);
    }
}