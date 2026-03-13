<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CategorieProduit extends Model
{
    use HasFactory;

    protected $table = 'categories_produits';
    protected $primaryKey = 'id_categorie';
    public $timestamps = true;

    protected $fillable = [
        'nom',
        'description',
        'segment',
        'image_url',
        'image',
        'slug',
        'icone',
        'parent_id',
        'ordre',
        'actif',
    ];

    // Relation inverse : une catégorie a plusieurs produits
    public function produits()
    {
        return $this->hasMany(Produit::class, 'id_categorie', 'id_categorie');
    }
}