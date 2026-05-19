<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Notifications\CustomResetPasswordNotification;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

class Utilisateur extends Authenticatable implements FilamentUser
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $table = 'utilisateurs';
    protected $primaryKey = 'id_utilisateur';

    protected $fillable = [
        'uuid',
        'nom',
        'prenom',
        'email',
        'telephone',
        'mot_de_passe',
        'is_admin',
        'statut',
        'can_access_client',
        'can_access_admin',
        'two_factor_enabled',
        'two_factor_code',
        'two_factor_expires_at',
        'id_pays',
        'remember_token',
        'admin_role',
        'last_login',
        'avatar',
        'avatar_data',
        'avatar_mime',
    ];

    protected $appends = ['avatar_url'];

    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar_data) {
            return url('/api/auth/' . $this->id_utilisateur . '/avatar');
        }
        if (!$this->avatar) {
            return null;
        }
        if (str_starts_with($this->avatar, 'http://') || str_starts_with($this->avatar, 'https://')) {
            return $this->avatar;
        }
        return url('/api/auth/' . $this->id_utilisateur . '/avatar');
    }

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    protected $hidden = [
        'mot_de_passe',
        'remember_token',
        'two_factor_code',
        'two_factor_expires_at',
        'avatar_data',
        'avatar_mime',
    ];

    protected $casts = [
        'email_verified_at'     => 'datetime',
        'is_admin'              => 'boolean',
        'statut'                => 'string',
        'can_access_client'     => 'boolean',
        'can_access_admin'      => 'boolean',
        'two_factor_enabled'    => 'boolean',
        'two_factor_expires_at' => 'datetime',
        'last_login'            => 'datetime',
        'mot_de_passe'          => 'hashed',
    ];

    /** Authentification : mot de passe personnalisé */
    public function getAuthPassword(): string
    {
        return $this->mot_de_passe;
    }

    /** Notifications de reset password */
    public function sendPasswordResetNotification($token, $url = null): void
    {
        $this->notify(new CustomResetPasswordNotification($token, $url));
    }

    /** Gestion du 2FA */
    public function generateTwoFactorCode(): void
    {
        $this->two_factor_code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->two_factor_expires_at = Carbon::now()->addMinutes(10);
        $this->save();
    }

    public function resetTwoFactorCode(): void
    {
        $this->two_factor_code = null;
        $this->two_factor_expires_at = null;
        $this->save();
    }

    public function hasValidTwoFactorCode(string $code): bool
    {
        return $this->two_factor_code === $code
            && $this->two_factor_expires_at
            && Carbon::now()->lessThanOrEqualTo($this->two_factor_expires_at);
    }

    /** Relation avec Pays */
    public function pays()
    {
        return $this->belongsTo(Pays::class, 'id_pays', 'id_pays');
    }

    /** Autorisation Filament */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->is_admin === true
            && $this->statut === 'actif'
            && $this->can_access_admin === true;
    }

    /** Nom affiché dans Filament */
    public function getFilamentName(): string
    {
        $fullName = trim(($this->prenom ?? '') . ' ' . ($this->nom ?? ''));
        return !empty($fullName) ? $fullName : ($this->email ?? 'Utilisateur #' . $this->id_utilisateur);
    }

    public function getUserName(): string
    {
        return $this->getFilamentName();
    }

    public function getNameAttribute(): string
    {
        return $this->getFilamentName();
    }

    /** Relations */
    public function formations()
    {
        return $this->belongsToMany(Formation::class, 'formation_user', 'id_utilisateur', 'id_formation')
                    ->withTimestamps();
    }

    public function produits()
    {
        return $this->hasMany(Produit::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function commandes()
    {
        return $this->hasMany(Commande::class, 'id_utilisateur', 'id_utilisateur');
    }

    /** Vérification des rôles */
    public function isSuperAdmin(): bool
    {
        return (bool) $this->is_admin
            && (bool) $this->can_access_admin
            && strtolower((string) $this->admin_role) === 'superadmin';
    }

    public function isAdminPays(): bool
    {
        $role = strtolower((string) $this->admin_role);
        if (in_array($role, ['admin', 'admin_pays', 'admin_national'], true)) {
            $role = 'admin_adjoint';
        }

        return (bool) $this->is_admin
            && (bool) $this->can_access_admin
            && in_array($role, ['admin_adjoint'], true);
    }
}