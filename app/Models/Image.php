<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Image extends Model
{
    use HasFactory, SoftDeletes, HasUuid;

    protected $table = 'images';
    protected $primaryKey = 'id_image';
    public $timestamps = true;

    protected $hidden = ['image_data', 'image_mime'];

    protected $fillable = [
        'url',
        'path',
        'alt',
        'image_data',
        'image_mime',
        'imageable_type',
        'imageable_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['image_url'];

    private function hasImageData(): bool
    {
        if (array_key_exists('image_data', $this->attributes)) {
            return $this->attributes['image_data'] !== null && $this->attributes['image_data'] !== '';
        }

        if (array_key_exists('has_image_data', $this->attributes)) {
            return (bool) $this->attributes['has_image_data'];
        }

        return false;
    }

    public function getImageUrlAttribute(): ?string
    {
        if ($this->hasImageData()) {
            return url('/api/images/' . $this->id_image . '/serve');
        }
        if ($this->url) {
            if (str_starts_with($this->url, 'http://') || str_starts_with($this->url, 'https://') || str_starts_with($this->url, '/')) {
                return $this->url;
            }
            return url($this->url);
        }
        return null;
    }

    /**
     * Relation polymorphique vers produit, formation ou blog.
     */
    public function imageable()
    {
        return $this->morphTo();
    }
}
