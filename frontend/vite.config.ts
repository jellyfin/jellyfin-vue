import { resolve } from 'node:path';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import Virtual from '@rollup/plugin-virtual';
import VueDevTools from 'vite-plugin-vue-devtools';
import Vue from '@vitejs/plugin-vue';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';
import { Vuetify3Resolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import UnoCSS from 'unocss/vite';
import VueRouter from 'unplugin-vue-router/vite';
import { defineConfig } from 'vite';
import { JBundle, JMonorepo } from '@jellyfin-vue/vite-plugins';
import { JellyfinVueUIToolkit } from '@jellyfin-vue/ui-toolkit/resolver';
import virtualModules from './scripts/virtual-modules';
import { localeFilesFolder } from './scripts/paths';

export default defineConfig({
  appType: 'spa',
  base: './',
  plugins: [
    ...JBundle,
    JMonorepo(import.meta.dirname, {
      splashscreen: {
        'fetch-priority': 'high'
      }
    }),
    Virtual(virtualModules),
    VueRouter({
      dts: resolve(import.meta.dirname, 'types/global/routes.d.ts'),
      importMode: 'sync',
      routeBlockLang: 'yaml',
      routesFolder: [
        {
          src: resolve(import.meta.dirname, 'src/pages')
        }
      ]
    }),
    Vue({
      template: {
        transformAssetUrls: {
          img: []
        }
      }
    }),
    /**
     * This plugin is used to autoimport Vue components.
     */
    Components({
      dirs: [resolve(import.meta.dirname, 'src/components')],
      dts: resolve(import.meta.dirname, 'types/global/components.d.ts'),
      resolvers: [
        Vuetify3Resolver(),
        JellyfinVueUIToolkit()
      ]
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
    cssCodeSplit: true,
    cssMinify: 'lightningcss',
    modulePreload: false,
    reportCompressedSize: false,
    rollupOptions: {
      input: {
        splashscreen: resolve(import.meta.dirname, 'src/splashscreen.ts'),
        main: resolve(import.meta.dirname, 'src/main.ts'),
        index: resolve(import.meta.dirname, 'index.html')
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
  worker: {
    format: 'es'
  }
});
