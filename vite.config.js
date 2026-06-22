import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { handlrBuild } from '@phillipsharring/handlr-build/vite';
import siteConfig from './site.config.js';

export default defineConfig({
    root: 'src',
    publicDir: '../public',
    server: {
        host: true,
        allowedHosts: ['phillipharrington.test'],
    },
    plugins: [tailwindcss(), handlrBuild({ siteConfig })],
    build: {
        outDir: '../dist',
        assetsDir: 'assets',
        manifest: true,
        emptyOutDir: true,
        rollupOptions: {
            input: { app: './src/app.js' },
        },
    },
});
