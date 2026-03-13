<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Archivage extends Model
{
    protected $table = 'archivages';
    protected $primaryKey = 'id_archivage';
    public $timestamps = false;

    protected $fillable = [
        'archivable_type',
        'archivable_id',
        'date_archivage',
        'raison',
    ];

    public function archivable()
    {
        return $this->morphTo();
    }
}