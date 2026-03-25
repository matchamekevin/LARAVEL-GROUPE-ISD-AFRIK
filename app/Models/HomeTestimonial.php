<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class HomeTestimonial extends Model
{
    protected $fillable = [
        'name',
        'role',
        'company',
        'text',
        'rating',
        'avatar_path',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['avatar_url'];

    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar_path) {
            return null;
        }

        if (str_starts_with($this->avatar_path, 'http://') || str_starts_with($this->avatar_path, 'https://')) {
            return $this->avatar_path;
        }

        if (str_starts_with($this->avatar_path, '/')) {
            return $this->avatar_path;
        }

        return Storage::disk('public')->url($this->avatar_path);
    }
}
