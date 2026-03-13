<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_logs';
    protected $primaryKey = 'id_log';
    public $timestamps = false;

    protected $fillable = [
        'action',
        'table_cible',
        'id_cible',
        'donnees_avant',
        'donnees_apres',
        'date_action',
        'id_utilisateur',
    ];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur', 'id_utilisateur');
    }
}