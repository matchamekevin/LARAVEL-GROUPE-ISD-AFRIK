<?php

namespace App\Models;
/**
 * @property \Illuminate\Database\Eloquent\Factories\Factory $factory
 */

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    // 👇 Spécifier le nom de la table
    protected $table = 'utilisateurs';
    
    // 👇 Spécifier la clé primaire
    protected $primaryKey = 'id_utilisateur';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'telephone',
        'mot_de_passe',
        'role',
        'is_admin',
        'statut',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'mot_de_passe',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'mot_de_passe' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Dire à Laravel que le mot de passe s'appelle 'mot_de_passe'
     */
    public function getAuthPassword()
    {
        return $this->mot_de_passe;
    }
    public function formations()
{
    return $this->belongsToMany(Formation::class, 'formation_user', 'id_utilisateur', 'id_formation')
                ->withTimestamps();
}

}