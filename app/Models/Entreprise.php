<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modèle représentant une entreprise du système.
 *
 * @property int $id_entreprise
 * @property string $nom
 * @property string $email
 * @property string $telephone
 * @property string $mot_de_passe
 * @property string $secteur
 * @property string $pays
 * @property string $adresse
 * @property int $nombre_participants
 * @property string $statut
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Entreprise extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $table = 'entreprises';
    protected $primaryKey = 'id_entreprise';

    protected $fillable = [
        'nom',
        'email',
        'telephone',
        'mot_de_passe',
        'secteur',
        'pays',
        'adresse',
        'nombre_participants',
        'statut',
    ];

    protected $hidden = [
        'mot_de_passe',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'mot_de_passe' => 'hashed',
        ];
    }

    public function getAuthPassword(): string
    {
        return $this->mot_de_passe;
    }

    public function reservations()
    {
        return $this->hasMany(ReservationFormation::class, 'id_entreprise');
    }

    public function commandes()
    {
        return $this->hasMany(Commande::class, 'id_entreprise');
    }
}