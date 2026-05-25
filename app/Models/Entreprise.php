<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class Entreprise extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasUuid;

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