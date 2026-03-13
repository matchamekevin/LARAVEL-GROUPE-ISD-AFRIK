<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuiviTechnique extends Model
{
    protected $table = 'suivi_techniques';
    protected $primaryKey = 'id_suivi';
    public $timestamps = false;

    protected $fillable = [
        'type',
        'message',
        'niveau',
        'date_log',
        'id_utilisateur',
    ];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur', 'id_utilisateur');
    }
}