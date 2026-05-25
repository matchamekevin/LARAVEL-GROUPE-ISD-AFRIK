<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketSupport extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'tickets_support';
    protected $primaryKey = 'id_ticket';
    public $timestamps = false;

    protected $fillable = [
        'sujet',
        'message',
        'statut',
        'date_creation',
        'id_utilisateur',
    ];

    /** Relations */
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }
}
