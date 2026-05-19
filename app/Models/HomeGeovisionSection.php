<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class HomeGeovisionSection extends Model
{
    protected $fillable = [
        'title',
        'description',
        'image_path',
        'image_data',
        'image_mime',
        'link',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if ($this->image_data) {
            return url('/api/home-geovision-sections/' . $this->id . '/image');
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
