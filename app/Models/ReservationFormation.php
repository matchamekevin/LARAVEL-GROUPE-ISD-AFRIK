<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modèle représentant une réservation de formation.
 *
 * @property int $id_reservation
 * @property int|null $id_utilisateur
 * @property int|null $id_entreprise
 * @property int $id_formation
 * @property string $type_reservation
 * @property int $nombre_places
 * @property string $statut
 * @property \Illuminate\Support\Carbon $date_reservation
 */
class ReservationFormation extends Model
{
    use HasFactory;

    protected $table = 'reservation_formation';
    protected $primaryKey = 'id_reservation';

    protected $fillable = [
        'id_utilisateur',
        'id_entreprise',
        'id_formation',
        'type_reservation',
        'nombre_places',
        'statut',
        'date_reservation',
    ];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    public function entreprise()
    {
        return $this->belongsTo(Entreprise::class, 'id_entreprise');
    }

    public function formation()
    {
        return $this->belongsTo(Formation::class, 'id_formation');
    }
}