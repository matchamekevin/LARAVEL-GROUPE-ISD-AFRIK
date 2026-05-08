<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DevisPrestation extends Model
{
    protected $fillable = [
        'prestation_slug',
        'prestation_name',
        'services',
        'technologies',
        'statut',
    ];

    protected $casts = [
        'services' => 'array',
        'technologies' => 'array',
    ];
}
