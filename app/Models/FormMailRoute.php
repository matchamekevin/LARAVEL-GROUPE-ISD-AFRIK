<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormMailRoute extends Model
{
    use HasFactory;

    protected $table = 'form_mail_routes';

    protected $fillable = [
        'form_key',
        'form_label',
        'description',
        'recipients',
        'is_active',
    ];

    protected $casts = [
        'recipients' => 'array',
        'is_active' => 'boolean',
    ];
}
