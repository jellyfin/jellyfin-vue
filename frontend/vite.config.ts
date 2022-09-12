import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';
import {
  Vuetify3Resolver,
  VueUseComponentsResolver
} from 'unplugin-vue-components/resolvers';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(
      process.env.COMMIT_HASH || process.env.CF_PAGES_COMMIT_SHA || ''
    )
  },
  plugins: [
    vue(),
    Pages({
      routeStyle: 'nuxt',
      importMode: 'sync'
    }),
    Layouts({
      importMode: () => 'sync'
    }),
    // This plugin allows to autoimport vue components
    Components({
      /**
       * The icons resolver finds icons components from 'unplugin-icons' using this convenction:
       * {prefix}-{collection}-{icon} e.g. <i-mdi-thumb-up />
       */
      resolvers: [
        IconsResolver(),
        Vuetify3Resolver(),
        VueUseComponentsResolver()
      ]
    }),
    /**
     * This plugin allows to use all icons from Iconify as vue components
     * See: https://github.com/antfu/unplugin-icons
     */
    Icons({
      compiler: 'vue3'
    }),
    VitePWA()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  resolve: {
    alias: {
      '@/': `${path.resolve(__dirname, './src')}/`,
      '~/': `${path.resolve(__dirname, './src')}/`
    }
  }
});
