import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import path from 'path';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000
  },
  define: {
    server_url_list: process.env.DEFAULT_SERVERS || '',
    commit_hash:
      process.env.COMMIT_HASH || process.env.CF_PAGES_COMMIT_SHA || ''
  },
  plugins: [
    createVuePlugin(),
    Pages({
      routeStyle: 'nuxt'
    }),
    Layouts(),
    // This plugin allows to autoimport vue components
    Components({
      /**
       * The icons resolver finds icons components from 'unplugin-icons' using this convenction:
       * {prefix}-{collection}-{icon} e.g. <i-mdi-thumb-up />
       */
      resolvers: [IconsResolver()]
    }),
    /**
     * This plugin allows to use all icons from Iconify as vue components
     * See: https://github.com/antfu/unplugin-icons
     */
    Icons({
      compiler: 'vue2'
    }),
    VitePWA()
  ],
  resolve: {
    alias: {
      '@/': `${path.resolve(__dirname, './src')}/`
    }
  }
});
