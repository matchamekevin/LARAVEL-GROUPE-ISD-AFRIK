<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pays extends Model
{
    use HasFactory, SoftDeletes, HasUuid;

    protected $table = 'pays';
    protected $primaryKey = 'id_pays';

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