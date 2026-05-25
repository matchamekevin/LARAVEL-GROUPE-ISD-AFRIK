<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'contact_messages';

    protected $fillable = [
        'nom_complet',
        'email',
        'telephone',
        'sujet',
        'message',
        'statut',
    ];
}
