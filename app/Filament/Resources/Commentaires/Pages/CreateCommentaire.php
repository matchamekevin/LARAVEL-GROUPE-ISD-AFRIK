<?php

namespace App\Filament\Resources\Commentaires\Pages;

use App\Filament\Resources\Commentaires\CommentaireResource;
use Filament\Resources\Pages\CreateRecord;

class CreateCommentaire extends CreateRecord
{
    protected static string $resource = CommentaireResource::class;
}