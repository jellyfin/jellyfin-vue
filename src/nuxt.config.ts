/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NuxtRouteConfig } from '@nuxt/types/config/router';
import type { NuxtConfig } from '@nuxt/types';
// @ts-expect-error - Individual icons doesn't have typings
import jellyfinIcon from 'simple-icons/icons/jellyfin';

const config: NuxtConfig = {
  /*
   ** Nuxt rendering mode
   ** See https://nuxtjs.org/api/configuration-mode
   */
  ssr: !!process.env.NUXT_SSR,
  /*
   ** Disables telemetry prompt while installing dependencies
   ** See https://github.com/nuxt/telemetry
   */
  telemetry: false,
  /*
   ** Nuxt target
   ** See https://nuxtjs.org/api/configuration-target
   */
  target: 'server',
  /*
   ** Module loading mode
   ** See https://nuxtjs.org/api/configuration-modern
   */
  modern: false,
  /*
   ** Progress bar between routes
   ** See https://nuxtjs.org/api/configuration-loading
   */
  loading: {
    color: '#00A4DC',
    failedColor: '#FF5252',
    height: '4px'
  },
  pwa: {
    meta: {
      nativeUI: true,
      appleStatusBarStyle: 'black-translucent',
      name: 'Jellyfin',
      theme_color: '#1c2331'
    },
    manifest: {
      name: 'Jellyfin',
      background_color: '#14141F'
    }
  },
  /*
   ** Headers of the page
   ** See https://nuxtjs.org/api/configuration-head
   */
  head: {
    titleTemplate: '%s - Jellyfin',
    title: 'Jellyfin',
    meta: [
      { charset: 'utf-8' },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || ''
      }
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },
  /*
   ** Global CSS
   */
  css: [
    '~/assets/global.scss',
    '@mdi/font/css/materialdesignicons.css',
    'vuetify/src/styles/styles.sass'
  ],
  /*
   ** Plugins to load before mounting the App
   ** https://nuxtjs.org/guide/plugins
   */
  plugins: [
    // Development
    { src: 'plugins/axe.ts', mode: 'client' },
    // General
    'plugins/persistedStatePlugin.ts',
    'plugins/appInitPlugin.ts',
    'plugins/veeValidate.ts',
    'plugins/nativeWebsocketPlugin.ts',
    // Components
    { src: 'plugins/components/swiper.ts', mode: 'client' },
    'plugins/components/vueVirtualScroller.ts',
    'plugins/components/veeValidate.ts',
    { src: 'plugins/components/vueFullscreen.ts', mode: 'client' },
    'plugins/components/vueDraggable.ts',
    // Utility
    'plugins/browserDetectionPlugin.ts',
    { src: 'plugins/playbackProfilePlugin.ts', mode: 'client' },
    'plugins/supportedFeaturesPlugin.ts',
    'plugins/apiPlugin.ts',
    // Directives
    'plugins/directives/hide.ts'
  ],
  /*
   ** Auto import components
   ** See https://nuxtjs.org/api/configuration-components
   */
  components: [{ path: '~/components', pathPrefix: false }],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    '@nuxt/typescript-build',
    // Doc: https://github.com/nuxt-community/stylelint-module
    '@nuxtjs/stylelint-module',
    '@nuxtjs/vuetify',
    '@nuxtjs/date-fns',
    '@nuxtjs/imagemin'
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    '@nuxtjs/i18n',
    [
      'nuxt-vuex-localstorage',
      {
        localStorage: ['user', 'deviceProfile', 'clientSettings']
      }
    ],
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/auth'
  ],
  /*
   ** Router configuration
   */
  router: {
    middleware: ['auth'],
    extendRoutes(routes: NuxtRouteConfig[]): void {
      // Extend all routes to be accessed by /index.html
      for (const route of routes) {
        if (route.path.slice(-1) === '/') {
          route.alias = route.path + 'index.html';
        } else {
          route.alias = route.path + '/index.html';
        }
      }
    }
  },
  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  axios: {
    baseURL: ''
  },
  /*
   ** Axios-based Authentication
   ** See https://auth.nuxtjs.org/schemes/local.html#options
   */
  auth: {
    redirect: {
      login: '/server/login',
      logout: '/server/login',
      callback: false,
      home: '/'
    },
    strategies: {
      jellyfin: {
        _scheme: '~/schemes/jellyfinScheme'
      }
    },
    cookie: {
      prefix: 'auth.',
      options: {
        path: '/'
      }
    },
    plugins: [
      '~/plugins/userLibraryPlugin.ts',
      '~/plugins/itemsPlugin.ts',
      '~/plugins/tvShowsPlugin.ts',
      '~/plugins/playbackPlugin.ts'
    ]
  },
  i18n: {
    locales: [
      { code: 'am', iso: 'am', name: 'አማርኛ', file: 'am.json' },
      { code: 'ar', iso: 'ar', name: 'العربية', file: 'ar.json' },
      {
        code: 'be',
        iso: 'be',
        name: 'беларуская мова',
        file: 'be_Latn.json'
      },
      { code: 'ca', iso: 'ca', name: 'Català', file: 'ca.json' },
      { code: 'cs', iso: 'cs', name: 'Čeština', file: 'cs.json' },
      { code: 'de', iso: 'de', name: 'Deutsch', file: 'de.json' },
      { code: 'el', iso: 'el', name: 'ελληνικά', file: 'el.json' },
      { code: 'en-US', iso: 'en-US', name: 'English', file: 'en-US.json' },
      { code: 'eo', iso: 'eo', name: 'Esperanto', file: 'eo.json' },
      { code: 'es', iso: 'es', name: 'Español', file: 'es.json' },
      {
        code: 'es-419',
        iso: 'es-419',
        name: 'Español (América Latina)',
        file: 'es_419.json'
      },
      { code: 'fa', iso: 'fa', name: 'فارسی', file: 'fa.json' },
      { code: 'fi', iso: 'fi', name: 'Suomi', file: 'fi.json' },
      { code: 'fil', iso: 'fil', name: 'Pilipino', file: 'fil.json' },
      { code: 'fr', iso: 'fr-FR', name: 'Français', file: 'fr-FR.json' },
      { code: 'he', iso: 'he', name: 'עברית', file: 'he.json' },
      { code: 'hi', iso: 'hi', name: 'हिन्दी', file: 'hi.json' },
      { code: 'hu', iso: 'hu', name: 'Magyar', file: 'hu.json' },
      { code: 'id', iso: 'id', name: 'Bahasa Indonesia', file: 'id.json' },
      { code: 'it', iso: 'it', name: 'Italiano', file: 'it.json' },
      { code: 'ja', iso: 'ja', name: '日本語', file: 'ja.json' },
      { code: 'kk', iso: 'kk', name: 'қазақ тілі', file: 'kk.json' },
      { code: 'ko', iso: 'ko', name: '한국어', file: 'ko.json' },
      { code: 'lt', iso: 'lt', name: 'Lietuvių kalba', file: 'lt.json' },
      { code: 'ml', iso: 'ml', name: 'മലയാളം', file: 'ml.json' },
      { code: 'ms', iso: 'ms', name: 'بهاس ملايو‎', file: 'ms.json' },
      { code: 'nb', iso: 'nb-NO', name: 'Norsk', file: 'nb_NO.json' },
      { code: 'nl', iso: 'nl', name: 'Nederlands', file: 'nl.json' },
      { code: 'nn', iso: 'nn', name: 'Norsk Nynorsk', file: 'nn.json' },
      { code: 'pa', iso: 'pa', name: 'ਪੰਜਾਬੀ', file: 'pa.json' },
      { code: 'pl', iso: 'pl', name: 'Polski', file: 'pl.json' },
      { code: 'pt', iso: 'pt', name: 'Português', file: 'pt.json' },
      {
        code: 'pt-BR',
        iso: 'pt-BR',
        name: 'Português (Brasil)',
        file: 'pt_BR.json'
      },
      { code: 'ro', iso: 'ro', name: 'Română', file: 'ro.json' },
      { code: 'ru', iso: 'ru', name: 'русский', file: 'ru.json' },
      { code: 'sk', iso: 'sk', name: 'Slovenčina', file: 'sk.json' },
      { code: 'sl', iso: 'sl', name: 'Slovenščina', file: 'sl.json' },
      {
        code: 'sr-Latn',
        iso: 'sr',
        name: 'српски језик',
        file: 'sr_Latn.json'
      },
      { code: 'sv', iso: 'sv', name: 'Svenska', file: 'sv.json' },
      { code: 'sw', iso: 'sw', name: 'Kiswahili', file: 'sw.json' },
      { code: 'ta', iso: 'ta', name: 'தமிழ்', file: 'ta.json' },
      { code: 'tr', iso: 'tr', name: 'Türkçe', file: 'tr.json' },
      { code: 'uk', iso: 'uk', name: 'Українська', file: 'uk.json' },
      { code: 'ur', iso: 'ur', name: 'اردو', file: 'ur.json' },
      { code: 'vi', iso: 'vi', name: 'Tiếng Việt', file: 'vi.json' },
      { code: 'zh-CN', iso: 'zh-CN', name: '简体中文', file: 'zh_Hans.json' },
      { code: 'zh-TW', iso: 'zh-TW', name: '繁體中文', file: 'zh_Hant.json' }
    ],
    lazy: true,
    langDir: 'locales/',
    strategy: 'no_prefix',
    defaultLocale: 'en-US',
    vueI18n: {
      fallbackLocale: 'en-US'
    }
  },
  dateFns: {
    locales: [
      'am',
      'ar',
      'be',
      'ca',
      'cs',
      'de',
      'el',
      'en-US',
      'es',
      'es419',
      'fi',
      'fr',
      'he',
      'hi',
      'hu',
      'id',
      'it',
      'ja',
      'kk',
      'ko',
      'lt',
      'ml',
      'ms',
      'nb',
      'nl',
      'nn',
      'pa',
      'pl',
      'pt',
      'pt-BR',
      'ro',
      'ru',
      'sk',
      'sl',
      'sr-Latn',
      'sv',
      'sw',
      'ta',
      'tr',
      'uk',
      'ur',
      'vi',
      'zh-CN',
      'zh-TW'
    ],
    defaultLocale: 'en-US',
    fallbackLocale: 'en-US'
  },
  /*
   ** vuetify module configuration
   ** https://github.com/nuxt-community/vuetify-module
   */
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    treeShake: true,
    defaultAssets: false,
    theme: {
      dark: true,
      default: 'dark',
      disable: false,
      themes: {
        dark: {
          primary: '#9d37c2',
          secondary: '#2f3951',
          accent: '#FF4081',
          info: '#0099CC',
          warning: '#FB8C00',
          error: '#FF5252',
          success: '#4CAF50',
          background: '#14141F',
          card: '#1c2331',
          thumb: '#252e41'
        },
        light: {
          primary: '#9d37c2',
          secondary: '#424242',
          accent: '#FF4081',
          info: '#33b5e5',
          warning: '#FB8C00',
          error: '#FF5252',
          success: '#4CAF50',
          background: '#f2f2f2',
          card: '#FFFFFF',
          thumb: '#000000'
        }
      },
      options: {
        customProperties: true
      }
    },
    icons: {
      iconfont: 'mdi',
      values: {
        jellyfin: jellyfinIcon.path
      }
    }
  },
  loadingIndicator: {
    name: 'circle',
    color: '#0086b3',
    background: '#14141F'
  },
  /*
   ** Build configuration
   ** See https://nuxtjs.org/api/configuration-build/
   */
  build: {
    loadingScreen: {
      image: 'icon.png',
      colors: {
        client: '#00A4DC',
        modern: '#aa5cc3',
        server: '#424242'
      }
    },
    optimizeCSS: true,
    optimization: {
      splitChunks: {
        chunks: 'all',
        maxSize: 800000
      }
    },
    extractCSS: {
      ignoreOrder: true
    },
    babel: {
      // envName: server, client, modern
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      presets(): any {
        return [
          [
            '@nuxt/babel-preset-app',
            {
              corejs: { version: 3 }
            }
          ]
        ];
      }
    },
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    extend(config, ctx): void {
      if (ctx.isClient) {
        config?.module?.rules.push({
          test: /\.worker\.ts$/,
          use: [
            {
              loader: 'comlink-loader',
              options: {
                singleton: true
              }
            }
          ],
          exclude: /(node_modules)/
        });
      }

      config.module?.rules.push(
        // Hacky rule to make the libass WASM not being parsed when requiring it for the file loader
        // https://github.com/webpack/webpack/issues/6725#issuecomment-391237775
        {
          test: /libass-wasm\/dist\/js\/subtitles-octopus-worker\.wasm/,
          type: 'javascript/auto'
        },
        {
          test: /libass-wasm\/dist\/js\/subtitles-octopus-worker/,
          loader: 'file-loader',
          options: { name: '[name].[ext]' }
        }
      );
    },
    transpile: [
      // JF client transpiled cause needed to support "export *" https://stackoverflow.com/a/59313455
      '@jellyfin/client-axios',
      '@nuxtjs/auth',
      'vee-validate/dist/rules'
    ]
  },

  /**
   * Host set to 0.0.0.0 in order to access the dev server on the LAN
   */
  server: {
    host: '0.0.0.0'
  }
};

// Add context-dependent modules to the build
if (process.env.NUXT_SSR) {
  config.buildModules?.push('@nuxtjs/pwa');
} else {
  config.modules?.push('@nuxtjs/pwa');
}

export default config;
