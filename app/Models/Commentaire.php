<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Commentaire
 * Représente un commentaire associé à un produit, une formation ou un blog.
 */
class Commentaire extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'commentaires';
    protected $primaryKey = 'id_commentaire';
    public $timestamps = true;

    protected $fillable = [
        'contenu',
        'note',
        'date',
        'commentable_type',
        'commentable_id',
        'id_utilisateur',
    ];

    /**
     * Casts pour transformer certains champs automatiquement.
     * ⚠️ Important : 'date' est casté en datetime pour éviter l'erreur
     * "Call to a member function format() on string".
     */
    protected $casts = [
        'date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** Relations */
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function commentable()
    {
        return $this->morphTo();
    }
}