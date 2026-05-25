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
        html { background: #f8f9fa; height: 100%; }
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f8f9fa; height: 100%; }
        #admin-root { min-height: 100vh; width: 100%; }
        .init-loader { display: flex; width: 100%; min-height: 100vh; }
        .init-loader-sidebar { width: 280px; background: linear-gradient(180deg,#172243,#0f1621); padding: 2rem 1.5rem; display: flex; flex-direction: column; gap: 24px; flex-shrink: 0; }
        .init-loader-content { flex: 1; padding: 40px; background: #f8f9fa; display: flex; flex-direction: column; gap: 24px; }
        .init-loader-header { display: flex; flex-direction: column; gap: 12px; }
        .init-loader-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); gap: 20px; }
        .init-loader-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
        .init-loader-card-body { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
        .init-loader-shape { height: 18px; border-radius: 10px; background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size: 200% 100%; animation: init-shimmer 1.4s infinite; }
        .init-loader-shape--h32 { height: 32px; }
        .init-loader-shape--w70 { width: 70%; }
        .init-loader-shape--w60 { width: 60%; }
        .init-loader-shape--w50 { width: 50%; }
        .init-loader-shape--w40 { width: 40%; }
        .init-loader-shape--w30 { width: 30%; }
        .init-loader-icon { width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0; }
        .init-loader-nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
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
    @viteReactRefresh
    @vite('resources/js/admin/main.jsx')
    <title>Admin</title>
  </head>
  <body>
        <div id="admin-root">
            <div class="init-loader">
                <aside class="init-loader-sidebar">
                    <div class="init-loader-shape init-loader-shape--h32 init-loader-shape--w70"></div>
                    <div style="display:flex;flex-direction:column;gap:8px">
                        <div class="init-loader-nav-item">
                            <div class="init-loader-shape init-loader-icon"></div>
                            <div class="init-loader-shape init-loader-shape--w60"></div>
                        </div>
                        <div class="init-loader-nav-item">
                            <div class="init-loader-shape init-loader-icon"></div>
                            <div class="init-loader-shape init-loader-shape--w50"></div>
                        </div>
                        <div class="init-loader-nav-item">
                            <div class="init-loader-shape init-loader-icon"></div>
                            <div class="init-loader-shape init-loader-shape--w60"></div>
                        </div>
                        <div class="init-loader-nav-item">
                            <div class="init-loader-shape init-loader-icon"></div>
                            <div class="init-loader-shape init-loader-shape--w40"></div>
                        </div>
                    </div>
                </aside>
                <main class="init-loader-content">
                    <div class="init-loader-header">
                        <div class="init-loader-shape init-loader-shape--h32 init-loader-shape--w40"></div>
                        <div class="init-loader-shape init-loader-shape--w60"></div>
                    </div>
                    <div class="init-loader-grid">
                        <div class="init-loader-card">
                            <div class="init-loader-card-body">
                                <div class="init-loader-shape init-loader-shape--w60"></div>
                                <div class="init-loader-shape"></div>
                                <div class="init-loader-shape init-loader-shape--w50"></div>
                            </div>
                        </div>
                        <div class="init-loader-card">
                            <div class="init-loader-card-body">
                                <div class="init-loader-shape init-loader-shape--w60"></div>
                                <div class="init-loader-shape"></div>
                                <div class="init-loader-shape init-loader-shape--w50"></div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
  </body>
</html>
