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
        .init-loader { position: fixed; inset: 0; z-index: 9999; background: #fff; transition: opacity 0.4s ease; overflow-y: auto; }
        .init-loader-nav { height: 72px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; border-bottom: 1px solid #f1f5f9; }
        .init-loader-nav-links { display: flex; gap: 24px; }
        .init-loader-main { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        .init-loader-hero { margin-bottom: 40px; display: flex; flex-direction: column; gap: 14px; }
        .init-loader-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 24px; }
        .init-loader-card { border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
        .init-loader-card-img { width: 100%; aspect-ratio: 16/10; }
        .init-loader-card-body { padding: 18px 20px 22px; display: flex; flex-direction: column; gap: 10px; }
        .init-loader-shape { height: 18px; border-radius: 10px; background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size: 200% 100%; animation: init-shimmer 1.4s infinite; }
        .init-loader-shape--h36 { height: 36px; }
        .init-loader-shape--w70 { width: 70%; }
        .init-loader-shape--w60 { width: 60%; }
        .init-loader-shape--w50 { width: 50%; }
        .init-loader-shape--w40 { width: 40%; }
        @keyframes init-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
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
        <div class="init-loader" id="init-loader">
            <div class="init-loader-nav">
                <div class="init-loader-shape init-loader-shape--h36 init-loader-shape--w40"></div>
                <div class="init-loader-nav-links">
                    <div class="init-loader-shape init-loader-shape--w50"></div>
                    <div class="init-loader-shape init-loader-shape--w40"></div>
                    <div class="init-loader-shape init-loader-shape--w50"></div>
                </div>
            </div>
            <div class="init-loader-main">
                <div class="init-loader-hero">
                    <div class="init-loader-shape init-loader-shape--h36 init-loader-shape--w70"></div>
                    <div class="init-loader-shape init-loader-shape--w50"></div>
                </div>
                <div class="init-loader-grid">
                    <div class="init-loader-card">
                        <div class="init-loader-shape init-loader-card-img"></div>
                        <div class="init-loader-card-body">
                            <div class="init-loader-shape init-loader-shape--w70"></div>
                            <div class="init-loader-shape"></div>
                            <div class="init-loader-shape init-loader-shape--w50"></div>
                        </div>
                    </div>
                    <div class="init-loader-card">
                        <div class="init-loader-shape init-loader-card-img"></div>
                        <div class="init-loader-card-body">
                            <div class="init-loader-shape init-loader-shape--w70"></div>
                            <div class="init-loader-shape"></div>
                            <div class="init-loader-shape init-loader-shape--w50"></div>
                        </div>
                    </div>
                    <div class="init-loader-card">
                        <div class="init-loader-shape init-loader-card-img"></div>
                        <div class="init-loader-card-body">
                            <div class="init-loader-shape init-loader-shape--w70"></div>
                            <div class="init-loader-shape"></div>
                            <div class="init-loader-shape init-loader-shape--w50"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</body>
</html>
