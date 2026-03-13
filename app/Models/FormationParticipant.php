<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormationParticipant extends Model
{
    use HasFactory;

    protected $table = 'formation_participants';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id_formation',
        'id_utilisateur',
        'nom',
        'prenom',
        'fonction',
        'contact',
        'prix',
    ];

    public function formation()
    {
        return $this->belongsTo(Formation::class, 'id_formation', 'id_formation');
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur', 'id_utilisateur');
    }
}
