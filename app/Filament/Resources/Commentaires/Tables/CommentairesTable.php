<?php

namespace App\Filament\Resources\Commentaires\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ForceDeleteBulkAction;
use Filament\Actions\RestoreBulkAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TrashedFilter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class CommentairesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('utilisateur.nom')
                    ->label('Utilisateur')
                    ->searchable()
                    ->sortable()
                    ->description(fn ($record) => $record->utilisateur?->email),

                TextColumn::make('contenu')
                    ->label('Commentaire')
                    ->searchable()
                    ->limit(100)
                    ->wrap(),

                TextColumn::make('note')
                    ->label('Note')
                    ->badge()
                    ->color(fn ($state) => match(true) {
                        $state >= 4 => 'success',
                        $state >= 3 => 'warning',
                        default => 'danger'
                    })
                    ->formatStateUsing(fn ($state) => $state ? "⭐ {$state}/5" : 'Sans note')
                    ->sortable(),

                TextColumn::make('commentable_type')
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

                TextColumn::make('commentable_id')
                    ->label('ID Lié')
                    ->sortable(),

                TextColumn::make('date')
                    ->label('Date')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(),

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
                SelectFilter::make('commentable_type')
                    ->label('Type')
                    ->options([
                        'App\\Models\\Produit' => 'Produit',
                        'App\\Models\\Formation' => 'Formation',
                        'App\\Models\\Blog' => 'Blog',
                    ]),
                SelectFilter::make('note')
                    ->label('Note')
                    ->options([
                        '5' => '⭐ 5 étoiles',
                        '4' => '⭐ 4 étoiles',
                        '3' => '⭐ 3 étoiles',
                        '2' => '⭐ 2 étoiles',
                        '1' => '⭐ 1 étoile',
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
            ])
            ->defaultSort('date', 'desc');
    }
}