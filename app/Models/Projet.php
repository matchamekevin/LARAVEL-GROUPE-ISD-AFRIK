<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Projet extends Model
{
    protected $fillable = [
        'title',
        'category',
        'description',
        'long_desc',
        'url',
        'slug',
        'image_path',
        'image_data',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if ($this->image_data) {
            return url('/api/projets/' . $this->id . '/image');
        }
        if (!$this->image_path) return null;
        if (str_starts_with($this->image_path, 'http://') || str_starts_with($this->image_path, 'https://'))
            return $this->image_path;
        if (str_starts_with($this->image_path, '/'))
            return $this->image_path;
        return '/storage/' . $this->image_path;
    }
}
