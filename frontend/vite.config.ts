import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import Virtual from '@rollup/plugin-virtual';
import VueMacros from 'unplugin-vue-macros/vite';
import Vue from '@vitejs/plugin-vue';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';
import { visualizer } from 'rollup-plugin-visualizer';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import {
  Vuetify3Resolver,
  VueUseComponentsResolver,
  VueUseDirectiveResolver
} from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import RadixVueResolver from 'radix-vue/resolver';
import UnoCSS from 'unocss/vite';
import VueRouter from 'unplugin-vue-router/vite';
import { defineConfig, type UserConfig } from 'vite';
import { entrypoints, localeFilesFolder, srcRoot } from './scripts/paths';
import virtualModules from './scripts/virtual-modules';

export default defineConfig(({ mode }): UserConfig => {
  const config: UserConfig = {
    appType: 'spa',
    base: './',
    cacheDir: '../node_modules/.cache/vite',
    plugins: [
      Virtual(virtualModules),
      VueRouter({
        dts: './types/global/routes.d.ts',
        importMode: 'sync',
        routeBlockLang: 'yaml'
      }),
      VueMacros({
        plugins: {
          vue: Vue({
            template: {
              transformAssetUrls: {
                img: []
              }
            }
          })
        }
      }),
      // This plugin allows to autoimport Vue components
      Components({
        dts: './types/global/components.d.ts',
        /**
         * The icons resolver finds icons components from 'unplugin-icons' using this convenction:
         * {prefix}-{collection}-{icon} e.g. <i-mdi-thumb-up />
         */
        resolvers: [
          IconsResolver(),
          VueUseComponentsResolver(),
          Vuetify3Resolver(),
          VueUseDirectiveResolver(),
          RadixVueResolver({
            prefix: 'R'
          })
        ]
      }),
      /**
       * This plugin allows to use all icons from Iconify as vue components
       * See: https://github.com/antfu/unplugin-icons
       */
      Icons({
        compiler: 'vue3'
      }),
      VueI18nPlugin({
        runtimeOnly: true,
        compositionOnly: true,
        fullInstall: false,
        forceStringify: true,
        include: localeFilesFolder
      }),
      UnoCSS()
    ],
    build: {
      /**
       * See main.ts for an explanation of this target
       */
      target: 'es2022',
      /**
       * Disable chunk size warnings
       */
      chunkSizeWarningLimit: Number.NaN,
      cssCodeSplit: true,
      cssMinify: 'lightningcss',
      modulePreload: false,
      reportCompressedSize: false,
      rollupOptions: {
        input: {
          splashscreen: entrypoints.splashscreen,
          main: entrypoints.main,
          index: entrypoints.index
        },
        ...(mode === 'analyze'
          ? {
              onwarn: (warning) => { console.warn(warning); }
            }
          : {}),
        output: {
          chunkFileNames: (chunkInfo) => {
            /**
             * This is the default value: https://rollupjs.org/configuration-options/#output-chunkfilenames
             */
            return chunkInfo.name === 'validation' ? 'assets/common-[hash].js' : '[name]-[hash].js';
          },
          validate: true,
          plugins: [
            mode === 'analyze'
              ? visualizer({
                open: true,
                filename: 'dist/stats.html'
              })
              : undefined
          ],
          /**
           * This is the first thing that should be debugged when there are issues
           * withe the bundle. Check these issues:
           * - https://github.com/vitejs/vite/issues/5142
           * - https://github.com/evanw/esbuild/issues/399
           * - https://github.com/rollup/rollup/issues/3888
           */
          manualChunks(id) {
            if (
              id.includes('virtual:locales')
              || id.includes('@intlify/unplugin-vue-i18n/messages')
            ) {
              return 'assets/locales';
            }
          }
        }
      }
    },
    css: {
      lightningcss: {
        nonStandard: {
          deepSelectorCombinator: true
        },
        targets: browserslistToTargets(browserslist())
      }
    },
    preview: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
      cors: true
    },
    server: {
      host: '0.0.0.0',
      port: 3000
    },
    resolve: {
      alias: {
        '@/': srcRoot
      }
    },
    worker: {
      format: 'es'
    }
  };

  return config;
});
