/**
 * Site-wide configuration. Injected into layouts via [[propName]] placeholders.
 */
export default {
    siteUrl: 'https://phillipharrington.com',
    siteName: 'Phillip Harrington',
    copyright: 'Copyright © Phillip Harrington. All rights reserved.',
    // Dev-only: render-blocking <link> to the source CSS so dev doesn't FOUC.
    // The `?direct` query is required — without it Vite serves the .css as a JS
    // module (text/javascript) and the browser refuses it as a stylesheet.
    // Build ignores this (prod uses the hashed CSS from the manifest).
    devCss: '/styles/style.css?direct',
};
