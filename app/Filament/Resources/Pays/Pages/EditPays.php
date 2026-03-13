<?php

namespace App\Filament\Resources\Pays\Pages;

use App\Filament\Resources\Pays\PaysResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Resources\Pages\EditRecord;

class EditPays extends EditRecord
{
    protected static string $resource = PaysResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
            ForceDeleteAction::make(),
            RestoreAction::make(),
        ];
    }
}
