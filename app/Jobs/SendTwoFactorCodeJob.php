<?php

namespace App\Jobs;

use App\Models\Utilisateur;
use App\Mail\TwoFactorCodeMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendTwoFactorCodeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $user;

    public function __construct(Utilisateur $user)
    {
        $this->user = $user;
    }

    public function handle(): void
    {
        Mail::to($this->user->email)->send(new TwoFactorCodeMail($this->user));
    }
}