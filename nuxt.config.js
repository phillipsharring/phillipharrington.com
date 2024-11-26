const iconLink = (rel, sizes, href, type) => ({
  ...{
    rel,
    sizes,
    href,
  },
  ...(type && { type }),
})

export default {
  ssr: true,

  target: 'static',

  head: {
    titleTemplate: '%s - Phillip Harrington',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'content-type', content: 'text/html; charset=utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'msapplication-TileColor', content: '#ffffff' },
      { name: 'msapplication-TileImage', content: '/ms-icon-144x144.png' },
      { name: 'theme-color', content: '#8dc640' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      iconLink('apple-touch-icon', '57x57', '/apple-icon-57x57.png'),
      iconLink('apple-touch-icon', '60x60', '/apple-icon-60x60.png'),
      iconLink('apple-touch-icon', '72x72', '/apple-icon-72x72.png'),
      iconLink('apple-touch-icon', '76x76', '/apple-icon-76x76.png'),
      iconLink('apple-touch-icon', '114x114', '/apple-icon-114x114.png'),
      iconLink('apple-touch-icon', '120x120', '/apple-icon-120x120.png'),
      iconLink('apple-touch-icon', '144x144', '/apple-icon-144x144.png'),
      iconLink('apple-touch-icon', '152x152', '/apple-icon-152x152.png'),
      iconLink('apple-touch-icon', '180x180', '/apple-icon-180x180.png'),
      iconLink('icon', '192x192', '/android-icon-192x192.png', 'image/png'),
      iconLink('icon', '32x32', '/favicon-32x32.png', 'image/png'),
      iconLink('icon', '96x96', '/favicon-96x96.png', 'image/png'),
      iconLink('icon', '16x16', '/favicon-16x16.png', 'image/png'),
      { rel: 'manifest', href: '/manifest.json' },
    ],
  },

  css: ['~/assets/scss/_base.scss'],

  // middleware: ['~/middleware/set-header'],

  plugins: [],

  components: true,

  buildModules: ['@nuxtjs/style-resources'],

  styleResources: {
    scss: ['~/assets/scss/_variables.scss', '~/assets/scss/_utils.scss'],
  },

  modules: ['@nuxt/content'],

  loading: '~/components/layout/loading-bar.vue',

  server: {
    port: process.env.PORT || 3002,
    host: process.env.HOST || 'localhost',
  },

  publicRuntimeConfig: {
    env: process.env.ENV || 'prod',
    gitlabBase:
      'https://gitlab.com/phillipsharring/phillipharrington.com/-/blob/main',
  },

  build: {
    devMiddleware: {
      headers: {
        'Cache-Control': 'no-store',
        Vary: '*',
      },
    },
  },

  generate: {
    subFolders: false,
    fallback: '404.html',
    async routes() {
      const { $content } = require('@nuxt/content')
      const files = await $content({ deep: true })
        .where({ status: { $ne: 'draft' } })
        .only(['path'])
        .fetch()
      return files
        .map((file) =>
          file.path === '/index' ? '/' : file.path.replace(/\/\d{2}$/, '')
        )
        .filter(function (value, index, self) {
          return self.indexOf(value) === index
        })
    },
  },

  hooks: {
    generate: {
      page(page) {
        if (page.path !== '/index.html') {
          page.path = page.path.replace(/\.html$/, '')
        }
      },
    },
  },
}
