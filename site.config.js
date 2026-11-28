import { GIT_SHA_COMMENT } from '@phillipsharring/handlr-build';

/**
 * Site-wide configuration. Injected into layouts via [[propName]] placeholders.
 */
export default {
    siteUrl: 'https://phillipharrington.com',
    siteName: 'Phillip Harrington',
    copyright: 'Copyright © Phillip Harrington. All rights reserved.',
    // Minify the baked HTML (build only; `vite dev` stays readable). Needs the
    // html-minifier-terser dev dependency. Minifying strips comments except
    // these; setting the list replaces handlr-build's defaults, so they're
    // repeated: html-minifier's own `<!--! ...-->` and `<!-- # ...-->`, the
    // deployed sha on Home, and the line for whoever views source on any page
    // (after Gene Wilder in The Frisco Kid: "I'm not a rabbi for nothing").
    minify: {
        ignoreCustomComments: [/^!/, /^\s*#/, GIT_SHA_COMMENT, /^\s*After all, I'm not a web nerd for nothing\.\s*$/],
    },
    // Dev-only: render-blocking <link> to the source CSS so dev doesn't FOUC.
    // The `?direct` query is required — without it Vite serves the .css as a JS
    // module (text/javascript) and the browser refuses it as a stylesheet.
    // Build ignores this (prod uses the hashed CSS from the manifest).
    devCss: '/styles/style.css?direct',
    // Where <code-file> reads from: the PHP course's examples, a sibling checkout
    // of github.com/phillipsharring/web-nerdism-php (the dev container mounts it
    // at the same relative path; see docker-compose.yml). The build fails if a
    // page includes a file that isn't there.
    codeRoot: '../web-nerdism-php',
    // Build-time syntax highlighting for <code-file> (needs shiki). Colors are
    // the --shiki-* variables in src/styles/style.css, light and dark.
    highlight: true,
};
