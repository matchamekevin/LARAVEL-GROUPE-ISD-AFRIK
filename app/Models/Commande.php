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
        'numero_commande',
        'date_commande',
        'statut',            // en_attente, payée, annulée
        'montant_total',
        'montant_commission',
        'date_livraison',
        'id_utilisateur',
    ];

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

    // Une commande peut avoir plusieurs factures (si plusieurs paiements)
    public function factures()
    {
        return $this->hasMany(Facture::class, 'id_commande');
    }

    // Une commande peut avoir une livraison (si produit physique)
    public function livraison()
    {
        return $this->hasOne(Livraison::class, 'id_commande');
    }
}
