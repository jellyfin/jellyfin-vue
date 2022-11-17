import path from 'path';
import { defineConfig, UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';
import {
  VueUseComponentsResolver,
  Vuetify3Resolver,
  VueUseDirectiveResolver
} from 'unplugin-vue-components/resolvers';
import { VitePWA } from 'vite-plugin-pwa';
import visualizer from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const config: UserConfig = {
    server: {
      port: 3000
    },
    define: {
      __COMMIT_HASH__: JSON.stringify(process.env.COMMIT_HASH || ''),
      __HISTORY_ROUTER_MODE__: process.env.HISTORY_ROUTER_MODE ? true : false
    },
    plugins: [
      vue(),
      Pages({
        routeStyle: 'nuxt',
        importMode: 'sync',
        moduleId: 'virtual:generated-pages'
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
          VueUseComponentsResolver(),
          Vuetify3Resolver(),
          VueUseDirectiveResolver()
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
      // vuetify({
      //   autoImport: true,
      //   styles: { configFile: 'src/assets/styles/variables.scss' }
      // })
    ],
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          plugins: [
            mode === 'analyze'
              ? // rollup-plugin-visualizer
                // https://github.com/btd/rollup-plugin-visualizer
                visualizer({
                  open: true,
                  filename: 'dist/stats.html',
                  gzipSize: true,
                  brotliSize: true
                })
              : undefined
          ]
        }
      }
    },
    preview: {
      port: 3000
    },
    resolve: {
      alias: {
        '@/': `${path.resolve(__dirname, './src')}/`,
        '~/': `${path.resolve(__dirname, './src')}/`
      }
    }
  };

  return config;
});
