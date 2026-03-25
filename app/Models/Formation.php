<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Class Formation
 * Représente une formation proposée sur la plateforme.
 */
class Formation extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'formations';
    protected $primaryKey = 'id_formation';
    public $timestamps = true;

    protected $fillable = [
        'uuid',
        'titre',
        'description',
        'duree',
        'prix',
        'categorie',
        'date_debut',
        'places_disponibles',
        'benefices',
        'id_pays',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'benefices' => 'json',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function (self $formation) {
            if (empty($formation->uuid)) {
                $formation->uuid = (string) Str::uuid();
            }
        });
    }

    /** Relations */

    // Relation avec le pays
    public function pays()
    {
        return $this->belongsTo(Pays::class, 'id_pays', 'id_pays');
    }

    // Relation polymorphique avec les images
    public function images()
    {
        return $this->morphMany(Image::class, 'imageable');
    }

    // Relation polymorphique avec les commentaires
    public function commentaires()
    {
        return $this->morphMany(Commentaire::class, 'commentable');
    }

    // Relation avec les factures
    public function factures()
    {
        return $this->hasMany(Facture::class, 'id_formation', 'id_formation');
    }

    // ✅ Relation avec les utilisateurs inscrits (pivot formation_user)
    // Correction : Utilisateur::class au lieu de User::class
    public function users()
    {
        return $this->belongsToMany(
            Utilisateur::class,   // ✅ le bon modèle (table: utilisateurs, clé: id_utilisateur)
            'formation_user',
            'id_formation',       // ✅ clé étrangère de Formation dans la table pivot
            'id_utilisateur'      // ✅ clé étrangère de Utilisateur dans la table pivot
        )
        ->withPivot([
            'responsable_nom',
            'responsable_prenom',
            'civilite',
            'fonction',
            'email',
            'telephone',
            'mobile',
            'societe',
            'adresse_societe',
            'facturation'
        ])
        ->withTimestamps();
    }

    // Relation avec les participants (table formation_participants)
    public function participants()
    {
        return $this->hasMany(FormationParticipant::class, 'id_formation', 'id_formation');
    }

    // Relation avec les paiements
    public function paiements()
    {
        return $this->hasMany(Paiement::class, 'id_formation', 'id_formation');
    }
}