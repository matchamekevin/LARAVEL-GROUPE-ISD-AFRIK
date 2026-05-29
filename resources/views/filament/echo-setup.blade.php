<script src="https://cdn.jsdelivr.net/npm/pusher-js@7.2.0/dist/web/pusher.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/laravel-echo@1.16.1/dist/echo.iife.js"></script>
<script>
    window.addEventListener('load', function () {
        if (window.Echo) return;

        window.Pusher = Pusher;

        window.Echo = new Echo({
            broadcaster: 'reverb',
            key: '{{ config('reverb.apps.apps.0.key') }}',
            wsHost: '{{ config('reverb.apps.apps.0.options.host', 'localhost') }}',
            wsPort: {{ config('reverb.apps.apps.0.options.port', 8080) }},
            wssPort: {{ config('reverb.apps.apps.0.options.port', 8080) }},
            forceTLS: {{ config('reverb.apps.apps.0.options.scheme', 'http') === 'https' ? 'true' : 'false' }},
            encrypted: {{ config('reverb.apps.apps.0.options.scheme', 'http') === 'https' ? 'true' : 'false' }},
            enabledTransports: ['ws', 'wss'],
            disableStats: true,
        });

        window.Echo.channel('content')
            .listen('.content.updated', function (payload) {
                window.dispatchEvent(new CustomEvent('content-changed', {
                    detail: { ...payload, at: Date.now() },
                }));
            });
    });
</script>
