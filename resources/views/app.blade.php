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
        .init-loader { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #fff; z-index: 9999; transition: opacity 0.4s ease; }
        .init-loader svg { width: 48px; height: 48px; animation: init-spin 1s linear infinite; }
        @keyframes init-spin { to { transform: rotate(360deg); } }
    </style>
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
</head>
<body class="font-[Corbel] bg-gray-50 text-gray-900">
    <div id="react-root">
        <div class="init-loader">
            <svg viewBox="0 0 24 24" fill="none" stroke="#172243" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
        </div>
    </div>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</body>
</html>
