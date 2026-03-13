<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class LignesCommande
 * Détail d’une commande : formation ou produit, quantité et prix.
 *
 * @property int $id_ligne
 * @property int $quantite
 * @property float $prix_unitaire
 * @property float $sous_total
 * @property int $id_commande
 * @property int|null $id_produit
 * @property int|null $id_formation
 */
class LignesCommande extends Model
{
    use HasFactory;

    protected $table = 'lignes_commandes';   // ✅ nom exact de la table
    protected $primaryKey = 'id_ligne';      // ✅ PK correcte

    protected $fillable = [
        'quantite',
        'prix_unitaire',
        'sous_total',
        'id_commande',
        'id_produit',
        'id_formation',
    ];

    /** Relations */

    // Chaque ligne appartient à une commande
    public function commande()
    {
        return $this->belongsTo(Commande::class, 'id_commande', 'id_commande');
    }

    // Chaque ligne peut concerner un produit
    public function produit()
    {
        return $this->belongsTo(Produit::class, 'id_produit', 'id_produit');
    }

    // Chaque ligne peut concerner une formation
    public function formation()
    {
        return $this->belongsTo(Formation::class, 'id_formation', 'id_formation');
    }
}
