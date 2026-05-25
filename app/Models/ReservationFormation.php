<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReservationFormation extends Model
{
    use HasFactory, HasUuid;

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