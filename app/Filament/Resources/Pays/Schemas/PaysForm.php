<?php

namespace App\Filament\Resources\Pays\Schemas;

use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\TextInput;
use Filament\Schemas\Schema;

class PaysForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Informations du pays')
                    ->schema([
                        TextInput::make('nom_pays')
                            ->label('Nom du pays')
                            ->required()
                            ->maxLength(255),

                        TextInput::make('code_pays')
                            ->label('Code pays (ex: TG, BJ, CI)')
                            ->required()
                            ->maxLength(3)
                            ->uppercase(),

                        TextInput::make('devise_locale')
                            ->label('Devise locale (ex: XOF, EUR)')
                            ->required()
                            ->maxLength(10),

                        TextInput::make('langue_principale')
                            ->label('Langue principale')
                            ->required()
                            ->maxLength(100),
                    ])
                    ->columns(2),
            ]);
    }
}