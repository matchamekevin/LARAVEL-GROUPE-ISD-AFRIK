<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class TicketSupport
 * Représente une demande d’assistance faite par un utilisateur.
 *
 * @property int $id_ticket
 * @property string $sujet
 * @property string $message
 * @property string $statut
 * @property \DateTime $date_creation
 * @property int $id_utilisateur
 */
class TicketSupport extends Model
{
    use HasFactory;

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
