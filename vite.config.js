import { defineConfig } from 'vite';
import path from 'path';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
        cors: true,
        watch: {
            ignored: ['**/vendor/**', '**/storage/**', '**/bootstrap/cache/**'],
            usePolling: true,
            interval: 1000,
        },
        middlewareMode: false,
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
        include: ['react', 'react-dom', 'react-router-dom', 'axios'],
    },
});
