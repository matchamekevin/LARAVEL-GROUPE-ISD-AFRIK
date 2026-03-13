<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Facture
 * Représente une facture générée après un paiement validé.
 *
 * @property int $id_facture
 * @property string $numero_facture
 * @property \DateTime $date_facture
 * @property float $montant
 * @property int $id_paiement
 * @property int|null $id_pays
 */
class Facture extends Model
{
    use HasFactory;

    protected $table = 'factures';
    protected $primaryKey = 'id_facture';

    protected $fillable = [
        'numero_facture',
        'date_facture',
        'montant',
        'id_paiement',
        'id_pays',
    ];

    /** Relations */

    // Une facture est liée à un paiement
    public function paiement()
    {
        return $this->belongsTo(Paiement::class, 'id_paiement');
    }

    // Une facture peut être rattachée à un pays (TVA, fiscalité)
    public function pays()
    {
        return $this->belongsTo(Pays::class, 'id_pays');
    }

    /** Relations indirectes */

    // Accéder à la commande via le paiement
    public function commande()
    {
        return $this->paiement ? $this->paiement->commande : null;
    }

    // Accéder aux formations ou produits via la commande
    public function items()
    {
        return $this->paiement && $this->paiement->commande
            ? $this->paiement->commande->items
            : collect();
    }
}
