<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Livraison
 * Représente la livraison d'une commande.
 */
class Livraison extends Model
{
    use HasFactory;

    protected $table = 'livraisons';
    protected $primaryKey = 'id_livraison';

    protected $fillable = [
        'adresse',
        'ville',
        'pays',
        'statut',
        'date_livraison_prev',
        'id_commande',
    ];

    /** Relations */

    // Une livraison appartient à une commande
    public function commande()
    {
        return $this->belongsTo(Commande::class, 'id_commande');
    }
}
