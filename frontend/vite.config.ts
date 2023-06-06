/* eslint-disable import/no-nodejs-modules */
import path, { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
/* eslint-enable import/no-nodejs-modules */
import { defineConfig, UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';
import { getFileBasedRouteName } from 'unplugin-vue-router';
import VueRouter from 'unplugin-vue-router/vite';
import {
  VueUseComponentsResolver,
  Vuetify3Resolver,
  VueUseDirectiveResolver
} from 'unplugin-vue-components/resolvers';
import visualizer from 'rollup-plugin-visualizer';
import virtual from '@rollup/plugin-virtual';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import autoprefixer from 'autoprefixer';
/**
 * We need to match our locales to the date-fns ones for proper localization of dates.
 * In order to reduce bundle size, we calculate here (at build time) only the locales that we
 * have in our client, to include only those, instead of importing all of them.
 *
 * We expose them later as 'virtual:date-fns/locales' using @rollup/plugin-virtual
 */
import * as datefnslocales from 'date-fns/locale';

const dfnskeys = Object.keys(datefnslocales);
const localeFilesFolder = resolve(
  dirname(fileURLToPath(import.meta.url)),
  './locales/**'
);
const localeFiles = readdirSync(localeFilesFolder.replace('**', ''));
/**
 * We need this due to the differences between the vue i18n and date-fns locales.
 */
const dfnsExports = localeFiles
  .map((l) => l.replace('.json', ''))
  .map((l) => {
    const testStrings = l.split('-');
    const lang = testStrings.join('');

    /**
     * - If the i18n locale exactly matches the date-fns one
     * - Removes the potential dash to match for instance "en-US" from i18n to "enUS" for date-fns.
     * We also need to remove all the hyphens, as using named exports with them is not valid JS syntax
     */
    if (dfnskeys.includes(l) || dfnskeys.includes(lang)) {
      return lang;
      /**
       * Takes the part before the potential hyphen to try, for instance "fr-FR" in i18n to "fr"
       */
    } else if (dfnskeys.includes(testStrings[0])) {
      return `${testStrings[0]} as ${lang}`;
    }
  })
  .filter((l): l is string => typeof l === 'string');
/**
 * End of date-fns locale parsing
 */

export default defineConfig(({ mode }): UserConfig => {
  const config: UserConfig = {
    server: {
      host: '0.0.0.0',
      port: 3000
    },
    define: {
      __COMMIT_HASH__: JSON.stringify(process.env.COMMIT_HASH || '')
    },
    plugins: [
      virtual({
        'virtual:date-fns/locales': `export { ${dfnsExports.join(
          ', '
        )} } from 'date-fns/locale'`
      }),
      /**
       * We're mixing both vite-plugin-pages and unplugin-vue-router because
       * there are issues with layouts and unplugin-vue-router is experimental:
       * https://github.com/posva/unplugin-vue-router/issues/29#issuecomment-1263134455
       *
       * At runtime we use vite-plugin-pages, while unplugin-vue-router is just
       * for types at development
       */
      Pages({
        routeStyle: 'nuxt',
        importMode: 'sync',
        moduleId: 'virtual:generated-pages'
      }),
      VueRouter({
        dts: './types/global/routes.d.ts',
        /**
         * unplugin-vue-router generates the route names differently
         * from vite-plugin-pages.
         *
         * We overwrite the name generation function so they match and TypeScript types
         * matches.
         */
        getRouteName: (node): string => {
          const name = getFileBasedRouteName(node);

          return name === '/'
            ? 'index'
            : name
                /**
                 * Remove first and trailing / character
                 */
                .replace(/^./, '')
                .replace(/\/$/, '')
                /**
                 * Routes with params have its types generated as
                 * _itemId, while vite-plugin-pages just use hyphens for everything
                 */
                .replace('/', '-')
                .replace('_', '');
        }
      }),
      vue({
        script: {
          defineModel: true
        }
      }),
      Layouts({
        importMode: () => 'sync',
        defaultLayout: 'default'
      }),
      // This plugin allows to autoimport vue components
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
        include: localeFilesFolder
      })
    ],
    build: {
      /**
       * See main.ts for an explanation of this target
       */
      target: 'es2022',
      modulePreload: false,
      reportCompressedSize: false,
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
    css: {
      postcss: {
        plugins: [autoprefixer()]
      }
    },
    preview: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
      cors: true
    },
    resolve: {
      alias: {
        '@/': `${path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          './src'
        )}/`
      }
    },
    worker: {
      format: 'es'
    }
  };

  return config;
});
