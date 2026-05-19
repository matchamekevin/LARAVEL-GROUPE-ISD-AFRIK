<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Image
 * Représente une image liée à un produit, une formation ou un blog.
 */
class Image extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'images';
    protected $primaryKey = 'id_image';
    public $timestamps = true;

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

    public function getImageUrlAttribute(): ?string
    {
        if ($this->image_data) {
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