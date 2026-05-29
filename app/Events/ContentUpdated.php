<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class ContentUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public string $modelType;

    public string|int $modelId;

    public string $action;

    public int $timestamp;

    public function __construct(string $modelType, string|int $modelId, string $action)
    {
        $this->modelType = $modelType;
        $this->modelId = $modelId;
        $this->action = $action;
        $this->timestamp = now()->getTimestamp();
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('content'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'content.updated';
    }
}
