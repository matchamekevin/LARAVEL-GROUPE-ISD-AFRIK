<?php

namespace App\Filament\Resources\Produits\Schemas;

use App\Models\CategorieProduit;
use App\Models\Pays;
use App\Models\Utilisateur;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Grid;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class ProduitForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Informations Générales')
                ->schema([
                    TextInput::make('titre')
                        ->required()
                        ->maxLength(255)
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn ($state, callable $set) => $set('slug', Str::slug($state))),

                    TextInput::make('slug')
                        ->required()
                        ->maxLength(255)
                        ->unique('produits', 'slug', ignoreRecord: true),

                    TextInput::make('reference')
                        ->label('Référence')
                        ->maxLength(100),

                    Textarea::make('description_courte')
                        ->rows(2)
                        ->maxLength(500),

                    Textarea::make('description')
                        ->rows(5)
                        ->required(),
                ]),

            Section::make('Catégorisation & Localisation')
                ->schema([
                    Grid::make(2)
                        ->schema([
                            Select::make('id_categorie')
                                ->label('Catégorie')
                                ->options(CategorieProduit::getTreeOptions())
                                ->searchable()
                                ->required(),

                            Select::make('id_pays')
                                ->label('Pays')
                                ->relationship('pays', 'nom_pays')
                                ->required(),

                            Select::make('id_utilisateur')
                                ->label('Vendeur / Propriétaire')
                                ->relationship('utilisateur', 'nom')
                                ->searchable()
                                ->required(),

                            Select::make('segment')
                                ->options([
                                    'general' => 'Général',
                                    'geovision' => 'GeoVision',
                                    'ingenierie' => 'Ingénierie',
                                ])
                                ->default('general'),
                        ]),
                ]),

            Section::make('Prix & Stock')
                ->schema([
                    Grid::make(3)
                        ->schema([
                            TextInput::make('prix')
                                ->numeric()
                                ->prefix('XOF')
                                ->required(),

                            TextInput::make('prix_promo')
                                ->label('Prix Promo')
                                ->numeric()
                                ->prefix('XOF'),

                            TextInput::make('stock')
                                ->numeric()
                                ->default(0)
                                ->required(),
                        ]),
                ]),

            Section::make('Statut')
                ->schema([
                    Toggle::make('statut')
                        ->label('Disponible')
                        ->default(true),

                    Toggle::make('est_en_vedette')
                        ->label('En vedette'),

                    Toggle::make('est_nouveau')
                        ->label('Nouveau'),
                ]),
        ]);
    }
}
