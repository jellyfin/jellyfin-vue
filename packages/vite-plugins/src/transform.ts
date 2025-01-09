import { extname, join } from 'node:path';
import type { Plugin } from 'vite';
import type { InputOptions } from 'rollup';
import { findUpSync } from 'find-up-simple';

/**
 * This plugin allows the Vite Config to be used as a monorepo with multiple Vite projects
 * In normal setups, Vite takes the application inputs from the `<script type="module" src="...">`
 * tags in the index.html file. This plugin generates those dynamically based on the `build.rollupOptions.input`
 * of the Vite config.
 *
 * @param path - Must always be import.meta.dirname, but needs to be passed from the parent module
 * @param inputAttrs - Additional attributes to provide for specific inputs
 */
export function JMonorepo(path: string, inputAttrs: Record<string, Record<string, string>>): Plugin {
  let resolvedInputs: NonNullable<InputOptions['input']> = {};

  return {
    name: 'Jellyfin_Vue:monorepo_setup',
    enforce: 'pre',
    config: () => ({
      root: path,
      cacheDir: findUpSync(join(path, 'node_modules'), { type: 'directory' }),
      build: {
        emptyOutDir: true
      }
    }),
    configResolved(config) {
      resolvedInputs = config.build.rollupOptions.input ?? {};
    },
    transformIndexHtml: {
      order: 'pre',
      handler: html => ({
        html,
        tags: Object.entries(resolvedInputs)
          .filter(([_, value]) => extname(value) !== '.html')
          .map(([key, value]) => ({
            tag: 'script',
            attrs: {
              type: 'module',
              src: value,
              ...inputAttrs[key]
            },
            injectTo: 'head'
          }))
      })
    }
  };
}
