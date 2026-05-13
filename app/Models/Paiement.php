<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Paiement extends Model
{
    use HasFactory;

    protected $table = 'paiements';

    protected $primaryKey = 'id_paiement';

    public $timestamps = true;

    protected $fillable = [
        'uuid',
        'reference_transaction',
        'moyen_paiement',
        'statut_paiement',
        'montant',
        'date_paiement',
        'id_commande',
        'id_formation',
        'id_produit',   // ✅ AJOUTÉ
        'quantite',     // ✅ AJOUTÉ
        'id_utilisateur',
    ];

    protected $casts = [
        'date_paiement' => 'datetime',
        'montant' => 'float',
        'quantite' => 'integer',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    // ─── Relations ───────────────────────────────────────────────────

    public function formation()
    {
        return $this->belongsTo(Formation::class, 'id_formation', 'id_formation');
    }

    public function commande()
    {
        return $this->belongsTo(Commande::class, 'id_commande', 'id_commande');
    }

    // ✅ AJOUTÉ — Relation avec le produit
    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit', 'id_produit');
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur', 'id_utilisateur');
    }
}
