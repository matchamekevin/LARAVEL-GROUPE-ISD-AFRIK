<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class DevisPrestation extends Model
{
    use HasUuid;
    protected $fillable = [
        'prestation_slug',
        'prestation_name',
        'services',
        'technologies',
        'deliverables',
        'statut',
    ];

    protected $casts = [
        'services' => 'array',
        'technologies' => 'array',
        'deliverables' => 'array',
    ];
}
