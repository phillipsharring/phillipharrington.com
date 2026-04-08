import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { grasprBuild } from '@phillipsharring/graspr-build/vite';
import siteConfig from './site.config.js';

export default defineConfig({
    root: 'src',
    publicDir: '../public',
    plugins: [tailwindcss(), grasprBuild({ siteConfig })],
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
