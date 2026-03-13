<?php

namespace App\Filament\Resources\Commentaires\Pages;

use App\Filament\Resources\Commentaires\CommentaireResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditCommentaire extends EditRecord
{
    protected static string $resource = CommentaireResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
            Actions\ForceDeleteAction::make(),
            Actions\RestoreAction::make(),
        ];
    }
}