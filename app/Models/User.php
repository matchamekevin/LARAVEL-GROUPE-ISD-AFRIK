<?php

namespace App\Models;
/**
 * @property \Illuminate\Database\Eloquent\Factories\Factory $factory
 */

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class User extends Authenticatable implements MustVerifyEmail
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
        'uuid',
        'name',
        'nom',
        'prenom',
        'email',
        'telephone',
        'password',
        'mot_de_passe',
        'is_admin',
        'statut',
        'admin_role',
        'can_access_client',
        'can_access_admin',
        'id_pays',
        'date_creation',
        'remember_token',
        'email_verified_at',
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

    protected static function booted(): void
    {
        static::creating(function (self $user) {
            if (Schema::hasColumn('utilisateurs', 'uuid') && empty($user->uuid)) {
                $user->uuid = (string) Str::uuid();
            }

            if (empty($user->id_pays) && Schema::hasTable('pays')) {
                $user->id_pays = \App\Models\Pays::query()->value('id_pays');
            }

            if (empty($user->date_creation)) {
                $user->date_creation = now();
            }

            if (!isset($user->is_admin)) {
                $user->is_admin = false;
            }

            if (empty($user->statut)) {
                $user->statut = 'actif';
            }

            if (Schema::hasColumn('utilisateurs', 'admin_role') && empty($user->admin_role)) {
                $user->admin_role = $user->is_admin ? 'admin_adjoint' : 'client';
            }

            if (Schema::hasColumn('utilisateurs', 'can_access_client') && !isset($user->can_access_client)) {
                $user->can_access_client = true;
            }

            if (Schema::hasColumn('utilisateurs', 'can_access_admin') && !isset($user->can_access_admin)) {
                $user->can_access_admin = (bool) $user->is_admin;
            }
        });
    }

    public function setPasswordAttribute($value): void
    {
        $this->attributes['mot_de_passe'] = $value;
    }

    public function getPasswordAttribute(): ?string
    {
        return $this->attributes['mot_de_passe'] ?? null;
    }

    public function setNameAttribute($value): void
    {
        $parts = preg_split('/\s+/', trim((string) $value), 2);
        $this->attributes['prenom'] = $parts[0] ?? '';
        $this->attributes['nom'] = $parts[1] ?? ($parts[0] ?? '');
    }

    public function getNameAttribute(): string
    {
        return trim(($this->attributes['prenom'] ?? '') . ' ' . ($this->attributes['nom'] ?? ''));
    }

    public function getIdAttribute(): ?int
    {
        return isset($this->attributes['id_utilisateur']) ? (int) $this->attributes['id_utilisateur'] : null;
    }
    public function formations()
{
    return $this->belongsToMany(Formation::class, 'formation_user', 'id_utilisateur', 'id_formation')
                ->withTimestamps();
}

}