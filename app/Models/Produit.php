<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Class Produit - VERSION COMPLÈTE
 * Représente un produit de la boutique ISD AFRIK.
 */
class Produit extends Model
{
    use HasFactory, SoftDeletes;

    protected $table      = 'produits';
    protected $primaryKey = 'id_produit';
    public    $timestamps = true;

    protected $fillable = [
        'uuid',
        'titre',
        'slug',
        'reference',
        'description',
        'description_courte',
        'prix',
        'prix_promo',
        'promo_debut',
        'promo_fin',
        'stock',
        'stock_alerte',
        'statut',
        'marque',
        'modele',
        'poids',
        'specifications',
        'garantie',
        'est_en_vedette',
        'est_nouveau',
        'en_promo',
        'vues',
        'note_moyenne',
        'nombre_avis',
        'id_categorie',
        'id_pays',
        'id_utilisateur',
        'date_creation',
    ];

    protected $casts = [
        'prix'           => 'decimal:2',
        'prix_promo'     => 'decimal:2',
        'poids'          => 'decimal:2',
        'note_moyenne'   => 'decimal:2',
        'specifications' => 'array',
        'est_en_vedette' => 'boolean',
        'est_nouveau'    => 'boolean',
        'en_promo'       => 'boolean',
        'stock'          => 'integer',
        'stock_alerte'   => 'integer',
        'date_creation'  => 'datetime',
        'promo_debut'    => 'datetime',
        'promo_fin'      => 'datetime',
    ];

    // ================================================================
    // BOOT - Auto-génération slug + suppression en cascade
    // ================================================================
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($produit) {
            if (empty($produit->uuid)) {
                $produit->uuid = (string) Str::uuid();
            }

            if (empty($produit->slug)) {
                $baseSlug = Str::slug($produit->titre);
                $slug = $baseSlug;
                $count = 1;

                // Générer un slug unique
                while (Produit::where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $count++;
                }

                $produit->slug = $slug;
            }
        });

        static::updating(function ($produit) {
            if ($produit->isDirty('titre') && empty($produit->slug)) {
                $produit->slug = Str::slug($produit->titre);
            }
        });

        static::deleting(function ($produit) {
            if ($produit->isForceDeleting()) {
                $produit->images()->forceDelete();
                $produit->commentaires()->forceDelete();
                $produit->lignesCommande()->forceDelete();
            } else {
                $produit->images()->delete();
                $produit->commentaires()->delete();
                $produit->lignesCommande()->delete();
            }
        });
    }

    // ================================================================
    // RELATIONS
    // ================================================================
    public function pays()
    {
        return $this->belongsTo(Pays::class, 'id_pays', 'id_pays');
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function images()
    {
        return $this->morphMany(Image::class, 'imageable');
    }

    public function commentaires()
    {
        return $this->morphMany(Commentaire::class, 'commentable');
    }

    public function lignesCommande()
    {
        return $this->hasMany(LigneCommande::class, 'id_produit', 'id_produit');
    }

    // ================================================================
    // SCOPES
    // ================================================================
    public function scopeDisponible($query)
    {
        return $query->where('statut', 'disponible')->where('stock', '>', 0);
    }

    public function scopeEnVedette($query)
    {
        return $query->where('est_en_vedette', true)->where('statut', 'disponible');
    }

    public function scopeNouveaux($query)
    {
        return $query->where('est_nouveau', true)->where('statut', 'disponible');
    }

    public function scopeEnPromotion($query)
    {
        return $query->whereNotNull('prix_promo')
                     ->where('prix_promo', '>', 0)
                     ->where(function ($q) {
                         $q->whereNull('promo_fin')
                           ->orWhere('promo_fin', '>=', now());
                     });
    }

    public function scopeParPays($query, int $idPays)
    {
        return $query->where('id_pays', $idPays);
    }

    public function scopePrixEntre($query, float $min, float $max)
    {
        return $query->whereBetween('prix', [$min, $max]);
    }

    public function scopeRecherche($query, string $terme)
    {
        return $query->where(function ($q) use ($terme) {
            $q->where('titre', 'LIKE', "%{$terme}%")
              ->orWhere('description', 'LIKE', "%{$terme}%")
              ->orWhere('marque', 'LIKE', "%{$terme}%")
              ->orWhere('reference', 'LIKE', "%{$terme}%");
        });
    }

    // ================================================================
    // ACCESSORS
    // ================================================================
    public function getPrixFinalAttribute(): float
    {
        if ($this->prix_promo && $this->isPrixPromoActif()) {
            return (float) $this->prix_promo;
        }
        return (float) $this->prix;
    }

    public function getEnPromoAttribute(): bool
    {
        return $this->isPrixPromoActif();
    }

    public function getPourcentageReductionAttribute(): int
    {
        if (!$this->en_promo || !$this->prix_promo) return 0;
        return (int) round((($this->prix - $this->prix_promo) / $this->prix) * 100);
    }

    public function getStockEnAlerteAttribute(): bool
    {
        return $this->stock > 0 && $this->stock <= $this->stock_alerte;
    }

    public function getRuptureStockAttribute(): bool
    {
        return $this->stock <= 0;
    }

    // ================================================================
    // MÉTHODES UTILITAIRES
    // ================================================================
    public function isPrixPromoActif(): bool
    {
        if (!$this->prix_promo) return false;

        $now = now();
        $debutOk = !$this->promo_debut || $this->promo_debut <= $now;
        $finOk   = !$this->promo_fin   || $this->promo_fin   >= $now;

        return $debutOk && $finOk;
    }

    public function incrementerVues(): void
    {
        $this->increment('vues');
    }

    public function recalculerNote(): void
    {
        $commentaires = $this->commentaires()->whereNotNull('note');
        $this->update([
            'note_moyenne' => $commentaires->avg('note') ?? 0,
            'nombre_avis'  => $commentaires->count(),
        ]);
    }

    public function getMorphClass(): string
    {
        return 'PRODUIT';
    }

    public function categorie()
{
    return $this->belongsTo(CategorieProduit::class, 'id_categorie', 'id_categorie');
}
}