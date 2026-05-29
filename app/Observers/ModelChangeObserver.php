<?php

namespace App\Observers;

use App\Events\ContentUpdated;

class ModelChangeObserver
{
    public function created($model): void
    {
        broadcast(new ContentUpdated(get_class($model), $model->getKey(), 'created'));
    }

    public function updated($model): void
    {
        broadcast(new ContentUpdated(get_class($model), $model->getKey(), 'updated'));
    }

    public function deleted($model): void
    {
        broadcast(new ContentUpdated(get_class($model), $model->getKey(), 'deleted'));
    }

    public function restored($model): void
    {
        broadcast(new ContentUpdated(get_class($model), $model->getKey(), 'restored'));
    }

    public function forceDeleted($model): void
    {
        broadcast(new ContentUpdated(get_class($model), $model->getKey(), 'forceDeleted'));
    }
}
