<?php

namespace App\Filament\Resources\Utilisateurs\Schemas;

use App\Models\Utilisateur;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class UtilisateurInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            TextEntry::make('nom'),
            TextEntry::make('prenom'),
            TextEntry::make('email')->label('Email'),
            TextEntry::make('telephone')->placeholder('-'),
            TextEntry::make('role'),
            IconEntry::make('is_admin')->boolean()->label('Admin'),
            IconEntry::make('statut')->boolean()->label('Actif'),
            TextEntry::make('pays.nom')->label('Pays')->placeholder('-'),
            TextEntry::make('two_factor_code')->placeholder('-'),
            TextEntry::make('two_factor_expires_at')->dateTime()->placeholder('-'),
            TextEntry::make('created_at')->dateTime()->label('Créé le')->placeholder('-'),
            TextEntry::make('updated_at')->dateTime()->label('Modifié le')->placeholder('-'),
            TextEntry::make('deleted_at')
                ->dateTime()
                ->visible(fn (Utilisateur $record): bool => $record->trashed())
                ->label('Supprimé le'),
            TextEntry::make('avatar')->placeholder('-'),
        ]);
    }
}