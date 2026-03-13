<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    protected $table      = 'paiements';
    protected $primaryKey = 'id_paiement';
    public $timestamps    = true;

    protected $fillable = [
        'reference_transaction',
        'moyen_paiement',
        'statut_paiement',
        'montant',
        'date_paiement',
        'id_formation',
        'id_utilisateur',
    ];

    protected $casts = [
        'date_paiement' => 'datetime',
        'montant'       => 'float',
    ];

    // ✅ Relation avec la formation — utilisée par FacturePage
    public function formation()
    {
        return $this->belongsTo(Formation::class, 'id_formation', 'id_formation');
    }

    // Relation avec l'utilisateur
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur', 'id_utilisateur');
    }
}