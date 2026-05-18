<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="icon" type="image/webp" href="{{ asset('logo.webp') }}">
    <link rel="shortcut icon" href="{{ asset('logo.webp') }}">
    <link rel="apple-touch-icon" href="{{ asset('logo.webp') }}">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { background: #ffffff; height: 100%; }
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff; height: 100%; }
        #root { display: block; min-height: 100vh; }
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
    @viteReactRefresh
    @vite('resources/js/admin/main.jsx')
    <title>Admin</title>
  </head>
  <body>
    <div id="admin-root"></div>
  </body>
</html>
