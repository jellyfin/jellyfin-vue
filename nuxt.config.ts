import type { NuxtConfig } from '@nuxt/types';

const config: NuxtConfig = {
  /*
   ** Nuxt rendering mode
   ** See https://nuxtjs.org/api/configuration-mode
   */
  mode: 'spa',
  /*
   ** Nuxt target
   ** See https://nuxtjs.org/api/configuration-target
   */
  target: 'server',
  /*
   ** Headers of the page
   ** See https://nuxtjs.org/api/configuration-head
   */
  head: {
    titleTemplate: '%s - ' + process.env.npm_package_name,
    title: process.env.npm_package_name || '',
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
    'plugins/userViewsApi.ts',
    'plugins/itemsApi.ts',
    'plugins/imageApi.ts',
    'plugins/userApi.ts',
    'plugins/snackbar.ts',
    'plugins/user.ts'
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
    // Doc: https://axios.nuxtjs.org/usage
    [
      'nuxt-vuex-localstorage',
      {
        localStorage: ['user']
      }
    ],
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
              Accept: 'application/json;profile="CamelCase"',
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
              Accept: 'application/json;profile="CamelCase"',
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
  /*
   ** vuetify module configuration
   ** https://github.com/nuxt-community/vuetify-module
   */
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    defaultAssets: false,
    theme: {
      dark: true,
      themes: {
        dark: {
          primary: '#00A4DC'
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
  build: {},

  /**
   * Host set to 0.0.0.0 in order to access the dev server on the LAN
   */
  server: {
    host: '0.0.0.0'
  }
};

export default config;
