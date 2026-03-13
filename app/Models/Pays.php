<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Pays
 * Représente un pays enregistré sur la plateforme ISD Afrik.
 * Chaque pays peut avoir plusieurs produits, formations et utilisateurs.
 */
class Pays extends Model
{
    use HasFactory, SoftDeletes;

    // Table associée
    protected $table = 'pays';

    // Clé primaire personnalisée
    protected $primaryKey = 'id_pays';

    // Type de clé primaire
    protected $keyType = 'int';

    // Auto-incrémentation activée
    public $incrementing = true;

    // Gestion des timestamps
    public $timestamps = true;

    // Colonnes autorisées à l’insertion/mise à jour
    protected $fillable = [
        'nom_pays',
        'code_pays',
        'devise_locale',
        'langue_principale',
    ];

    /**
     * Relations
     */

    // ✅ Un pays peut avoir plusieurs utilisateurs
    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'id_pays', 'id_pays');
    }

    // ✅ Un pays peut avoir plusieurs produits
    public function produits()
    {
        return $this->hasMany(Produit::class, 'id_pays', 'id_pays');
    }

    // ✅ Un pays peut avoir plusieurs formations
    public function formations()
    {
        return $this->hasMany(Formation::class, 'id_pays', 'id_pays');
    }
}