import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import Virtual from '@rollup/plugin-virtual';
import VueDevTools from 'vite-plugin-vue-devtools';
import Vue from '@vitejs/plugin-vue';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import {
  Vuetify3Resolver,
  VueUseComponentsResolver,
  VueUseDirectiveResolver
} from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import UnoCSS from 'unocss/vite';
import VueRouter from 'unplugin-vue-router/vite';
import { defineConfig } from 'vite';
/**
 * TODO: Replace with @jellyfin-vue/vite-plugins after https://github.com/vitejs/vite/issues/5370
 * is fixed
 */
import { JellyfinVueAnalysis, JellyfinVueChunking } from '../packages/vite-plugins';
import { entrypoints, localeFilesFolder, srcRoot } from './scripts/paths';
import virtualModules from './scripts/virtual-modules';

export default defineConfig({
  appType: 'spa',
  base: './',
  cacheDir: '../node_modules/.cache/vite',
  plugins: [
    JellyfinVueAnalysis(),
    JellyfinVueChunking(),
    Virtual(virtualModules),
    VueRouter({
      dts: './types/global/routes.d.ts',
      importMode: 'sync',
      routeBlockLang: 'yaml'
    }),
    Vue({
      template: {
        transformAssetUrls: {
          img: []
        }
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
    VueI18nPlugin({
      runtimeOnly: true,
      compositionOnly: true,
      fullInstall: false,
      forceStringify: true,
      include: localeFilesFolder,
      dropMessageCompiler: true
    }),
    UnoCSS(),
    VueDevTools()
  ],
  build: {
    /**
     * See main.ts for an explanation of this target
     */
    target: 'esnext',
    /**
     * Disable chunk size warnings
     */
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
      output: {
        validate: true
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
});
