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
        'imageable_type',
        'imageable_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation polymorphique vers produit, formation ou blog.
     */
    public function imageable()
    {
        return $this->morphTo();
    }
}