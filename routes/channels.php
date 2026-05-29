<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('content', function () {
    return true;
});
