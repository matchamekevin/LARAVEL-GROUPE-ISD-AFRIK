<?php

namespace App\Filament\Resources\Commentaires\Schemas;

use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Textarea;
use Filament\Schemas\Components\Select;
use Filament\Schemas\Components\DateTimePicker;
use Filament\Schemas\Schema;
use App\Models\Utilisateur;

class CommentaireForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Commentaire')
                    ->schema([
                        Select::make('id_utilisateur')
                            ->label('Utilisateur')
                            ->relationship('utilisateur', 'nom')
                            ->searchable()
                            ->preload()
                            ->required(),

                        Textarea::make('contenu')
                            ->label('Contenu du commentaire')
                            ->required()
                            ->rows(5)
                            ->maxLength(1000)
                            ->columnSpanFull(),

                        Select::make('note')
                            ->label('Note')
                            ->options([
                                1 => '⭐ 1 étoile',
                                2 => '⭐⭐ 2 étoiles',
                                3 => '⭐⭐⭐ 3 étoiles',
                                4 => '⭐⭐⭐⭐ 4 étoiles',
                                5 => '⭐⭐⭐⭐⭐ 5 étoiles',
                            ])
                            ->nullable(),

                        DateTimePicker::make('date')
                            ->label('Date du commentaire')
                            ->default(now())
                            ->required(),
                    ])
                    ->columns(2),

                Section::make('Association')
                    ->schema([
                        Select::make('commentable_type')
                            ->label('Type d\'élément')
                            ->options([
                                'App\\Models\\Produit' => 'Produit',
                                'App\\Models\\Formation' => 'Formation',
                                'App\\Models\\Blog' => 'Blog',
                            ])
                            ->required()
                            ->reactive(),

                        Select::make('commentable_id')
                            ->label('Élément associé')
                            ->required()
                            ->searchable()
                            ->options(function (callable $get) {
                                $type = $get('commentable_type');
                                
                                if (!$type) {
                                    return [];
                                }

                                $model = app($type);
                                
                                // Adapter selon vos colonnes
                                if ($type === 'App\\Models\\Produit') {
                                    return $model->pluck('titre', 'id_produit');
                                }
                                
                                if ($type === 'App\\Models\\Formation') {
                                    return $model->pluck('titre', 'id_formation');
                                }
                                
                                if ($type === 'App\\Models\\Blog') {
                                    return $model->pluck('titre', 'id_blog');
                                }

                                return [];
                            }),
                    ])
                    ->columns(2),
            ]);
    }
}