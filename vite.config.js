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
        // Comments live in AWS, not in this repo: read them from the live site
        // so pages here don't 404 on /api/comments/*. Posting from here goes
        // to the real moderation inbox.
        proxy: { '/api': { target: 'https://phillipharrington.com', changeOrigin: true } },
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
