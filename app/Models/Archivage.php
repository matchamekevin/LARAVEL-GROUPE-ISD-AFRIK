<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Archivage extends Model
{
    use HasUuid;
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