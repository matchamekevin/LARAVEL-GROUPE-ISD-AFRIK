<?php

namespace App\Filament\Resources\Utilisateurs\Pages;

use App\Filament\Resources\Utilisateurs\UtilisateurResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewUtilisateur extends ViewRecord
{
    protected static string $resource = UtilisateurResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
