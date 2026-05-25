<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class HomeMarketingCard extends Model
{
    use HasUuid;
    public const SECTION_LABELS = [
        'offer' => 'Nos Offres',
        'featured_product' => 'Produits phares',
        'home_promotion' => 'Promotions accueil',
        'promotion_page' => 'Page promotions',
    ];

    protected $hidden = ['image_data', 'image_mime'];

    protected $fillable = [
        'section',
        'title',
        'description',
        'badge_text',
        'meta_text',
        'cta_label',
        'target_url',
        'image_path',
        'image_data',
        'image_mime',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['image_url'];

    public static function allowedSections(): array
    {
        return array_keys(self::SECTION_LABELS);
    }

    public function getImageUrlAttribute(): ?string
    {
        if ($this->image_data) {
            return url('/api/home-marketing-cards/' . $this->id . '/image');
        }

        if (!$this->image_path) {
            return null;
        }

        if (str_starts_with($this->image_path, 'http://') || str_starts_with($this->image_path, 'https://')) {
            return $this->image_path;
        }

        if (str_starts_with($this->image_path, '/')) {
            return $this->image_path;
        }

        if (!Storage::disk('public')->exists($this->image_path)) {
            return null;
        }

        return Storage::disk('public')->url($this->image_path);
    }
}
