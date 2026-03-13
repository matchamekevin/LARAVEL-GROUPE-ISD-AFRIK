<?php

namespace App\Filament\Resources\Images\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ForceDeleteBulkAction;
use Filament\Actions\RestoreBulkAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Filters\TrashedFilter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ImagesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('url')
                    ->label('Aperçu')
                    ->height(60)
                    ->width(60)
                    ->disk('public')  // ✅ Ajout du disque
                    ->defaultImageUrl('/images/placeholder.png'), // ✅ Image par défaut si manquante

                TextColumn::make('alt')
                    ->label('Texte alternatif')
                    ->searchable()
                    ->sortable()
                    ->limit(50)
                    ->default('Photo illustrative'), // ✅ Valeur par défaut

                TextColumn::make('imageable_type')
                    ->label('Type')
                    ->formatStateUsing(fn ($state) => match($state) {
                        'App\\Models\\Produit' => 'Produit',
                        'App\\Models\\Formation' => 'Formation',
                        'App\\Models\\Blog' => 'Blog',
                        default => $state
                    })
                    ->badge()
                    ->color(fn ($state) => match($state) {
                        'App\\Models\\Produit' => 'success',
                        'App\\Models\\Formation' => 'info',
                        'App\\Models\\Blog' => 'warning',
                        default => 'gray'
                    })
                    ->sortable(),

                TextColumn::make('imageable_id')
                    ->label('ID Lié')
                    ->sortable(),

                TextColumn::make('path')
                    ->label('Chemin')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->limit(50),

                TextColumn::make('url')
                    ->label('URL')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->limit(50),

                TextColumn::make('created_at')
                    ->label('Créé le')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->label('Modifié le')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('deleted_at')
                    ->label('Supprimé le')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                TrashedFilter::make(),
                SelectFilter::make('imageable_type')
                    ->label('Type')
                    ->options([
                        'App\\Models\\Produit' => 'Produit',
                        'App\\Models\\Formation' => 'Formation',
                        'App\\Models\\Blog' => 'Blog',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
                RestoreAction::make(),
                ForceDeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                    ForceDeleteBulkAction::make(),
                    RestoreBulkAction::make(),
                ]),
            ]);
    }
}