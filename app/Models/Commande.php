<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Commande
 * Représente une commande passée par un utilisateur (formation ou produit).
 *
 * @property int $id_commande
 * @property string $numero_commande
 * @property \DateTime $date_commande
 * @property string $statut
 * @property float $montant_total
 * @property float|null $montant_commission
 * @property \DateTime|null $date_livraison
 * @property int $id_utilisateur
 */
class Commande extends Model
{
    use HasFactory;

    protected $table = 'commandes';

    protected $primaryKey = 'id_commande';

    protected $fillable = [
        'uuid',           // ✅ AJOUTER
        'numero_commande',
        'date_commande',
        'statut',
        'type_commande',
        'montant_total',
        'montant_commission',
        'date_livraison',
        'id_utilisateur',
    ];

    // ✅ AJOUTER cette méthode
    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    /** Relations */

    // Une commande appartient à un utilisateur
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_utilisateur');
        // ⚡ utilise User si tu es sur Laravel standard
    }

    // Une commande contient plusieurs items (formation ou produit)
    public function items()
    {
        return $this->hasMany(CommandeItem::class, 'id_commande');
    }

    // Une commande peut avoir plusieurs paiements (tentatives, partiels)
    public function paiements()
    {
        return $this->hasMany(Paiement::class, 'id_commande');
    }

    // Une commande peut avoir plusieurs factures (via paiements)
    public function factures()
    {
        return $this->hasManyThrough(Facture::class, Paiement::class, 'id_commande', 'id_paiement', 'id_commande', 'id_paiement');
    }

    // Une commande peut avoir une livraison (si produit physique)
    public function livraison()
    {
        return $this->hasOne(Livraison::class, 'id_commande');
    }
}
