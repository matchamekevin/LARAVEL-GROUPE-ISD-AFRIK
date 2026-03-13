<?php

namespace App\Filament\Resources\Utilisateurs\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Select;
use Filament\Schemas\Schema;

class UtilisateurForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('nom')
                ->required(),

            TextInput::make('prenom')
                ->required(),

            TextInput::make('email')
                ->label('Email')
                ->email()
                ->required()
                ->unique(ignoreRecord: true),

            TextInput::make('telephone')
                ->tel(),

            TextInput::make('mot_de_passe')
                ->password()
                ->dehydrateStateUsing(fn ($state) => $state ? bcrypt($state) : null)
                ->required(fn ($context) => $context === 'create')
                ->label('Mot de passe'),

            Select::make('role')
                ->options([
                    'client' => 'Client',
                    'admin' => 'Administrateur',
                ])
                ->default('client')
                ->required(),

            Toggle::make('is_admin')
                ->label('Admin ?'),

            Toggle::make('statut')
                ->label('Actif ?'),

            Select::make('admin_role')
                ->label('Rôle administratif')
                ->options([
                    'superadmin' => 'Super Admin',
                    'admin_pays' => 'Admin Pays',
                ])
                ->visible(fn () => auth()->user()?->isSuperAdmin())
                ->required(),

            Select::make('id_pays')
                ->relationship('pays', 'nom_pays')
                ->label('Pays')
                ->required(),
        ]);
    }
}