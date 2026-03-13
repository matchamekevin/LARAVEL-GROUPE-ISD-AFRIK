<?php

namespace App\Filament\Resources\Pays\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ForceDeleteBulkAction;
use Filament\Actions\RestoreBulkAction;
use Filament\Actions\ViewAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TrashedFilter;
use Filament\Tables\Table;

class PaysTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nom_pays')
                    ->label('Nom du pays')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('code_pays')
                    ->label('Code')
                    ->searchable()
                    ->sortable()
                    ->badge(),

                TextColumn::make('devise_locale')
                    ->label('Devise')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('langue_principale')
                    ->label('Langue')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('utilisateurs_count')
                    ->label('Utilisateurs')
                    ->counts('utilisateurs')
                    ->sortable(),

                TextColumn::make('produits_count')
                    ->label('Produits')
                    ->counts('produits')
                    ->sortable(),

                TextColumn::make('formations_count')
                    ->label('Formations')
                    ->counts('formations')
                    ->sortable(),

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
            ])
            ->recordActions([
                ViewAction::make(),
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