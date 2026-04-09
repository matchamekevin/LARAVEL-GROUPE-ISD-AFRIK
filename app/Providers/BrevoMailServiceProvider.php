<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Mail\MailManager;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class BrevoMailServiceProvider extends ServiceProvider
{
    public function register()
    {
        // nothing to register
    }

    public function boot()
    {
        /** @var MailManager $manager */
        $manager = $this->app->make(MailManager::class);

        $manager->extend('brevo', function ($config) {
            $apiKey = $config['key'] ?? config('services.brevo.key') ?? env('BREVO_API_KEY');
            $client = $this->app->bound(HttpClientInterface::class)
                ? $this->app->make(HttpClientInterface::class)
                : HttpClient::create();

            return new \App\Mail\BrevoTransport($apiKey, $client);
        });
    }
}
