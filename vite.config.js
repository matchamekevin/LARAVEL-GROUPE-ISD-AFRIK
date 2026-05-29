import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const devPort = Number(env.VITE_DEV_PORT || 5173);
    const devHost = env.VITE_DEV_HOST || '0.0.0.0';

    let appUrl;
    try {
        appUrl = env.APP_URL ? new URL(env.APP_URL) : null;
    } catch {
        appUrl = null;
    }

    const appHost = appUrl?.hostname || 'localhost';
    const isRemoteAppHost = !['localhost', '127.0.0.1', '::1'].includes(appHost);
    const useAppUrlForHmr = String(env.VITE_USE_APP_URL_HMR || '').toLowerCase() === 'true';
    const defaultHmrHost = useAppUrlForHmr && isRemoteAppHost ? appHost : 'localhost';
    const defaultHmrProtocol = useAppUrlForHmr && isRemoteAppHost && appUrl?.protocol === 'https:' ? 'wss' : 'ws';
    const defaultHmrClientPort = useAppUrlForHmr && isRemoteAppHost && appUrl?.protocol === 'https:' ? 443 : devPort;
    const hmrHost = env.VITE_HMR_HOST || defaultHmrHost;
    const hmrProtocol = env.VITE_HMR_PROTOCOL || defaultHmrProtocol;
    const hmrClientPort = Number(env.VITE_HMR_PORT || defaultHmrClientPort);
    const origin = env.VITE_DEV_SERVER_URL || `http://localhost:${devPort}`;

    return {
        server: {
            host: devHost,
            port: devPort,
            strictPort: true,
            origin,
            hmr: {
                host: hmrHost,
                protocol: hmrProtocol,
                clientPort: hmrClientPort,
                port: devPort,
            },
            cors: {
                origin: '*',
            },
            watch: {
                // Évite les redémarrages HMR intempestifs quand .env est touché
                ignored: ['**/vendor/**', '**/storage/**', '**/bootstrap/cache/**', '**/.env', '**/.env.*'],
            },
            middlewareMode: false,
            proxy: {
                '/api': {
                    target: 'http://127.0.0.1:8000',
                    changeOrigin: true,
                },
                '/sanctum': {
                    target: 'http://127.0.0.1:8000',
                    changeOrigin: true,
                },
                '/storage': {
                    target: 'http://127.0.0.1:8000',
                    changeOrigin: true,
                },
                '/uploads': {
                    target: 'http://127.0.0.1:8000',
                    changeOrigin: true,
                },
                '/images': {
                    target: 'http://127.0.0.1:8000',
                    changeOrigin: true,
                },
                '/logo.webp': {
                    target: 'http://127.0.0.1:8000',
                    changeOrigin: true,
                },
            },
        },
        plugins: [
            react({
                fastRefresh: true,
                jsxRuntime: 'automatic',
            }),
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.js', 'resources/js/app.jsx', 'resources/js/admin/main.jsx'],
                refresh: ['resources/views/**', 'resources/js/pages/**/*.jsx', 'resources/js/admin/pages/**/*.jsx'],
            }),
        ],
        resolve: {
            alias: {
                react: path.resolve(__dirname, 'node_modules/react'),
                'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
            },
            dedupe: ['react', 'react-dom'],
        },
        build: {
            sourcemap: false,
            chunkSizeWarningLimit: 700,
            rollupOptions: {
                output: {
                    manualChunks: {
                        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                        'ui-vendor': ['@fortawesome/fontawesome-free'],
                    },
                },
            },
        },
        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                'react-router-dom',
                'axios',
                'i18next',
                'react-i18next',
                'react-hot-toast',
                '@tanstack/react-query',
                'pusher-js',
                'laravel-echo',
            ],
        },
    };
});
