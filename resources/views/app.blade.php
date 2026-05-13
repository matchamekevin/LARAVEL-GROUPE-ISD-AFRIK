<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/webp" href="{{ asset('logo.webp') }}">
    <link rel="shortcut icon" href="{{ asset('logo.webp') }}">
    <link rel="apple-touch-icon" href="{{ asset('logo.webp') }}">
    <title>ISD AFRIK</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { background: #ffffff; height: 100%; }
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff; height: 100%; }
        #react-root { min-height: 100vh; display: block; }
    </style>
    @vite('resources/css/app.css')
    <script>
        /* Répondre silencieusement aux appels du browser logger pour éviter le spam console */
        const origFetch = window.fetch.bind(window);
        window.fetch = function (...args) {
            const request = args[0];
            const url = typeof request === 'string' ? request : request && request.url ? request.url : '';

            if (url.includes('/_boost/browser-logs')) {
                return Promise.resolve(new Response('{"ok":true}', {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }));
            }

            return origFetch(...args);
        };

        /* Filtrer les logs spécifiques du browser-logger pour éviter le spam */
        ['log','info','warn','error'].forEach((fn) => {
            const orig = console[fn].bind(console);
            console[fn] = function(...args) {
                try {
                    const first = args[0];
                    if (typeof first === 'string' && (first.includes('Browser logger') || first.includes('_boost') || first.includes('Failed to send logs'))) {
                        return;
                    }
                } catch (e) {}
                return orig(...args);
            };
        });

        /* Masquer ou remplacer les images externes qui échouent (ngrok) pour éviter les erreurs en console */
        window.addEventListener('error', function (e) {
            const target = e.target || e.srcElement;
            if (!target) return;
            if (target.tagName === 'IMG') {
                if (typeof target.src === 'string' && target.src.includes('ngrok-free.dev')) {
                    target.style.display = 'none';
                }
            }
        }, true);
    </script>
    <script>
        (function () {
            var host = window.location.hostname;
            var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
            if (!isLocal || !('serviceWorker' in navigator)) {
                return;
            }

            navigator.serviceWorker.getRegistrations()
                .then(function (registrations) {
                    return Promise.all(registrations.map(function (registration) {
                        return registration.unregister();
                    }));
                })
                .catch(function () {});

            if ('caches' in window) {
                caches.keys()
                    .then(function (cacheNames) {
                        return Promise.all(cacheNames
                            .filter(function (name) { return name.indexOf('isd-afrik') === 0; })
                            .map(function (name) { return caches.delete(name); }));
                    })
                    .catch(function () {});
            }
        })();
    </script>
</head>
<body class="font-[Corbel] bg-gray-50 text-gray-900">
    <div id="react-root"></div>
    @viteReactRefresh
    @vite('resources/js/app.jsx')
</body>
</html>