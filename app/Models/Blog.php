<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Blog
 * Articles de blog créés par les utilisateurs.
 */
class Blog extends Model
{
    use HasFactory;

    protected $table = 'blogs';
    protected $primaryKey = 'id_blog';
    public $timestamps = false;

    protected $fillable = [
        'titre',
        'contenu',
        'date_pub',
        'id_utilisateur',
    ];

    /** Relations */
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    // Un blog peut avoir plusieurs commentaires
    public function commentaires()
    {
        return $this->morphMany(Commentaire::class, 'commentable');
    }

    // Un blog peut avoir plusieurs images
    public function images()
    {
        return $this->morphMany(Image::class, 'imageable');
    }
}
