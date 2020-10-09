import type { NuxtConfig } from '@nuxt/types';

const config: NuxtConfig = {
  /*
   ** Nuxt rendering mode
   ** See https://nuxtjs.org/api/configuration-mode
   */
  ssr: false,
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
  css: ['@mdi/font/css/materialdesignicons.css'],
  /*
   ** Plugins to load before mounting the App
   ** https://nuxtjs.org/guide/plugins
   */
  plugins: [
    // Components
    'plugins/components/vueperSlides.ts',
    'plugins/components/vueVirtualScroller.ts',
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
    '@nuxtjs/vuetify'
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    'nuxt-i18n',
    [
      'nuxt-vuex-localstorage',
      {
        localStorage: ['user']
      }
    ],
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/auth-next',
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
  axios: {},
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
      local: {
        scheme: 'local',
        endpoints: {
          login: {
            url: '/Users/authenticatebyname',
            method: 'post',
            propertyName: false,
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-Emby-Authorization':
                'MediaBrowser Client="Jellyfin Web", Device="Firefox", DeviceId="TW96aWxsYS81LjAgKFgxMTsgTGludXggeDg2XzY0OyBydjo3Ny4wKSBHZWNrby8yMDEwMDEwMSBGaXJlZm94Lzc3LjB8MTU5NTQ1MTYzMzE4OQ11", Version="10.7.0"'
            }
          },
          logout: {
            url: '/Sessions/Logout',
            method: 'post',
            propertyName: false,
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
          },
          user: false
        },
        // TODO: Figure out which token settings are REALLY needed
        // FIXME: Duplicate authorization header: "Authorization" and "X-Emby-Authorization"
        tokenName: 'X-Emby-Authorization',
        tokenType: '',
        tokenRequired: true,
        globalToken: true,
        changeOrigin: true,
        autoFetchUser: false,
        token: {
          type: false
        },
        refreshToken: {
          type: false
        }
      }
    },
    plugins: ['plugins/userInit.ts']
  },
  i18n: {
    locales: [
      { code: 'chi', iso: 'zh-Hans', name: '简体中文', file: 'zh_Hans.json' },
      { code: 'cs', iso: 'cs-CZ', name: 'Čeština', file: 'cs.json' },
      { code: 'de', iso: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', iso: 'en-US', name: 'English', file: 'en-US.json' },
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
    strategy: 'no_prefix'
  },
  /*
   ** vuetify module configuration
   ** https://github.com/nuxt-community/vuetify-module
   */
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
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
          info: '#2196F3',
          warning: '#FB8C00',
          error: '#FF5252',
          success: '#4CAF50',
          background: '#101010'
        },
        light: {
          primary: '#00A4DC',
          secondary: '#424242',
          accent: '#FF4081',
          info: '#2196F3',
          warning: '#FB8C00',
          error: '#FF5252',
          success: '#4CAF50',
          background: '#f2f2f2'
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
    babel: {
      // envName: server, client, modern
      presets() {
        return [
          [
            '@nuxt/babel-preset-app',
            {
              corejs: { version: 3 }
            }
          ]
        ];
      }
    }
  },

  /**
   * Host set to 0.0.0.0 in order to access the dev server on the LAN
   */
  server: {
    host: '0.0.0.0'
  }
};

export default config;
