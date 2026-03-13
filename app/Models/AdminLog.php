<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminLog extends Model
{
    use HasFactory;

    // Champs autorisés pour l'insertion en masse
    protected $fillable = [
        'admin_id',
        'action',
    ];

    /**
     * Relation : chaque log appartient à un administrateur
     */
    public function admin()
    {
        return $this->belongsTo(Utilisateur::class, 'admin_id');
    }
}