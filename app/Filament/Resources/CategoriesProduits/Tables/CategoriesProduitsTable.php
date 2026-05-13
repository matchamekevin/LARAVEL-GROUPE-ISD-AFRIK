<?php

namespace App\Filament\Resources\CategoriesProduits\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class CategoriesProduitsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nom')
                    ->label('Nom')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('parent.nom')
                    ->label('Parent')
                    ->placeholder('Racine')
                    ->sortable(),

                TextColumn::make('segment')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'general' => 'gray',
                        'geovision' => 'success',
                        'ingenierie-page' => 'info',
                        default => 'gray',
                    }),

                TextColumn::make('produits_count')
                    ->label('Produits')
                    ->counts('produits'),

                ToggleColumn::make('actif')
                    ->label('Actif'),

                TextColumn::make('ordre')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('segment')
                    ->options([
                        'general' => 'Catalogue Général',
                        'geovision' => 'GeoVision',
                        'ingenierie-page' => 'Ingénierie Page',
                    ]),
            ])
            ->actions([
                ViewAction::make(),
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
