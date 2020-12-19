/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { NuxtConfig } from '@nuxt/types';
import webpack from 'webpack';

const config: NuxtConfig = {
  /*
   ** Nuxt rendering mode
   ** See https://nuxtjs.org/api/configuration-mode
   */
  ssr: false,
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
  modern: 'client',
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
      appleStatusBarStyle: 'dark',
      name: 'Jellyfin',
      theme_color: '#424242'
    },
    manifest: {
      name: 'Jellyfin',
      background_color: '#101010'
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
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
  css: ['~/assets/global.scss', '@mdi/font/css/materialdesignicons.css'],
  /*
   ** Plugins to load before mounting the App
   ** https://nuxtjs.org/guide/plugins
   */
  plugins: [
    // General
    'plugins/appInitPlugin.ts',
    'plugins/veeValidate.ts',
    // Components
    'plugins/components/swiper.ts',
    'plugins/components/vueperSlides.ts',
    'plugins/components/vueVirtualScroller.ts',
    'plugins/components/veeValidate.ts',
    // Utility
    'plugins/browserDetection.ts',
    'plugins/playbackProfile.ts',
    'plugins/apiPlugin.ts'
  ],
  /*
   ** Auto import components
   ** See https://nuxtjs.org/api/configuration-components
   */
  components: true,
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    '@nuxt/typescript-build',
    // Doc: https://github.com/nuxt-community/stylelint-module
    '@nuxtjs/stylelint-module',
    '@nuxtjs/vuetify',
    '@nuxtjs/date-fns'
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    'nuxt-i18n',
    [
      'nuxt-vuex-localstorage',
      {
        localStorage: ['user', 'deviceProfile', 'servers']
      }
    ],
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/auth',
    '@nuxtjs/pwa'
  ],
  /*
   ** Router configuration
   */
  router: {
    middleware: ['auth']
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
      login: '/login',
      logout: '/login',
      callback: false,
      home: '/'
    },
    strategies: {
      jellyfin: {
        _scheme: '~/schemes/jellyfinScheme'
      }
    }
  },
  i18n: {
    locales: [
      { code: 'chi', iso: 'zh-Hans', name: '简体中文', file: 'zh_Hans.json' },
      { code: 'cs', iso: 'cs-CZ', name: 'Čeština', file: 'cs.json' },
      { code: 'de', iso: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', iso: 'en-US', name: 'English', file: 'en-US.json' },
      { code: 'es', iso: 'es-ES', name: 'Español (España)', file: 'es.json' },
      { code: 'fr', iso: 'fr-FR', name: 'Français', file: 'fr-FR.json' },
      { code: 'nb', iso: 'nb-NO', name: 'Bokmål', file: 'nb_NO.json' },
      { code: 'nl', iso: 'nl-NL', name: 'Nederlands', file: 'nl.json' },
      { code: 'pl', iso: 'pl-PL', name: 'Polski', file: 'pl.json' },
      { code: 'ro', iso: 'ro-RO', name: 'Română', file: 'ro.json' },
      { code: 'sk', iso: 'sk-SK', name: 'Slovenčina', file: 'sk.json' },
      { code: 'sl', iso: 'sl-SI', name: 'Slovenščina', file: 'sl.json' },
      { code: 'sv', iso: 'sv-SE', name: 'Svenska', file: 'sv.json' },
      { code: 'ta', iso: 'ta-IN', name: 'தமிழ்', file: 'ta.json' },
      { code: 'tr', iso: 'tr-TR', name: 'Türkçe', file: 'tr.json' },
      { code: 'vi', iso: 'vi-VN', name: 'Tiếng Việt', file: 'vi.json' }
    ],
    lazy: true,
    langDir: 'locales/',
    strategy: 'no_prefix',
    defaultLocale: 'en',
    vueI18n: {
      fallbackLocale: 'en'
    },
    detectBrowserLanguage: { useCookie: false }
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
          primary: '#00A4DC',
          secondary: '#424242',
          accent: '#FF4081',
          info: '#0099CC',
          warning: '#FB8C00',
          error: '#FF5252',
          success: '#4CAF50',
          background: '#101010',
          track: '#272727',
          thumb: '#303030'
        },
        light: {
          primary: '#00A4DC',
          secondary: '#424242',
          accent: '#FF4081',
          info: '#33b5e5',
          warning: '#FB8C00',
          error: '#FF5252',
          success: '#4CAF50',
          background: '#f2f2f2',
          track: '#FFFFFF',
          thumb: '#000000'
        }
      },
      options: {
        customProperties: true
      }
    }
  },
  /*
   ** Build configuration
   ** See https://nuxtjs.org/api/configuration-build/
   */
  build: {
    // @ts-ignore -- Undocumented options
    loadingScreen: {
      image: 'icon.png',
      colors: {
        client: '#00A4DC',
        modern: '#424242'
      }
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
    extend(
      config: webpack.Configuration,
      { isClient }: { isClient: boolean }
    ): void {
      if (isClient) {
        // Web Worker support
        config.module?.rules.push({
          test: /\.worker\.(js|ts)$/i,
          use: [
            {
              loader: 'comlink-loader',
              options: {
                singleton: true
              }
            }
          ]
        });
      }
    },
    transpile: ['@nuxtjs/auth', 'vee-validate/dist/rules']
  },

  /**
   * Host set to 0.0.0.0 in order to access the dev server on the LAN
   */
  server: {
    host: '0.0.0.0'
  }
};

export default config;
