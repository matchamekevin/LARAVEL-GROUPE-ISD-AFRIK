import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: false,
        hmr: {
            protocol: 'ws',
            host: 'localhost',
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    build: {
        sourcemap: false,
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return;
                    }

                    if (id.includes('react') || id.includes('scheduler')) {
                        return 'react-vendor';
                    }

                    if (id.includes('react-router')) {
                        return 'router-vendor';
                    }

                    if (id.includes('i18next')) {
                        return 'i18n-vendor';
                    }

                    if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg') || id.includes('dompurify')) {
                        return 'pdf-vendor';
                    }

                    if (id.includes('@fortawesome')) {
                        return 'fa-vendor';
                    }

                    return 'vendor';
                },
            },
        },
    },
});
