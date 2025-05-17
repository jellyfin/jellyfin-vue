import { basename, resolve } from 'node:path';
import { globSync } from 'node:fs';
import { lstat, rename, rm } from 'node:fs/promises';
import type { LiteralUnion } from 'type-fest';
import type { RollupLog } from 'rollup';
import prettyBytes from 'pretty-bytes';
import Sonda from 'sonda/rollup';
import { normalizePath, preview, type Plugin } from 'vite';

/**
 * TODO: Track https://github.com/vitejs/vite/pull/19005 so we can pull Vite's default config instead
 * of hardcoding it here.
 */
const defaultConfig = { build: { outDir: 'dist' } };

/**
 * This plugin extracts the logic for the analyze commands, so the main Vite config is cleaner.
 */
export function JBundleAnalysis(): Plugin {
  let mode: LiteralUnion<'analyze:bundle' | 'analyze:cycles', string>;
  const report_filename = () => resolve(defaultConfig.build.outDir, 'bundle-report.html');
  const warnings: RollupLog[] = [];

  return {
    name: 'Jellyfin_Vue:bundle_analysis',
    enforce: 'pre',
    config: (_, env) => {
      mode = env.mode;

      if (env.mode === 'analyze:bundle') {
        return {
          build: {
            sourcemap: true,
            rollupOptions: {
              plugins: [
                Sonda({
                  open: false,
                  filename: report_filename(),
                  detailed: true,
                  sources: true,
                  gzip: false,
                  brotli: false
                })
              ]
            }
          }
        };
      } else if (env.mode === 'analyze:cycles') {
        return {
          build: {
            rollupOptions: {
              onwarn: (warning) => {
                if (warning.code === 'CIRCULAR_DEPENDENCY') {
                  warnings.push(warning);
                }
              }
            }
          }
        };
      }
    },
    closeBundle: async () => {
      if (mode === 'analyze:cycles') {
        if (warnings.length > 0) {
          for (const warning of warnings) {
            console.warn(warning);
          }

          throw new Error('There are circular dependencies');
        }
      } else if (mode === 'analyze:bundle') {
        await rename(report_filename(), resolve(defaultConfig.build.outDir, 'index.html'));

        for (const file of globSync(resolve(defaultConfig.build.outDir, '**/*'))) {
          if (!file.endsWith('index.html')) {
            await rm(file, { force: true, recursive: true });
          }
        }

        const server = await preview({
          configLoader: 'runner'
        });

        console.log();
        server.printUrls();
      }
    }
  };
}

/**
 * Creates the Rollup's chunking strategy of the application (for code-splitting)
 */
export function JBundleChunking(): Plugin {
  return {
    name: 'Jellyfin_Vue:bundle_chunking',
    enforce: 'pre',
    config: () => ({
      build: {
        rollupOptions: {
          output: {
            /**
             * This is the first thing that should be debugged when there are issues
             * withe the bundle. Check these issues:
             * - https://github.com/vitejs/vite/issues/5142
             * - https://github.com/evanw/esbuild/issues/399
             * - https://github.com/rollup/rollup/issues/3888
             */
            manualChunks(id) {
              const match = /node_modules\/([^/]+)/.exec(id)?.[1];

              /**
               * Split each vendor in its own chunk
               */
              if (match) {
                return `vendor/${match.replace('@', '')}`;
              }

              /**
               * Split localization strings into separate chunks
               */
              if (id.includes('virtual:')) {
                if (id.includes('locales/vuetify')) {
                  return 'localization/vendor/vuetify';
                } else if (id.includes('locales/date-fns')) {
                  return 'localization/vendor/date-fns';
                } else if (id.includes('i18next/resources')) {
                  const targetPath = basename(id.split('/').at(-1)!);
                  const isIndex = targetPath === 'resources';

                  return isIndex ? 'localization' : `localization/strings/${targetPath}`;
                }
              }
            }
          }
        }
      }
    })
  };
}

/**
 * Reports the total siz and also per file type
 */
export function JBundleSizeReport(): Plugin {
  const files = new Map<string, number>();
  const sizes = new Map<string, number>();
  let outDir: string;
  let totalSize = 0;
  const convert = (bytes: number) => prettyBytes(bytes, { minimumFractionDigits: 2 });

  return {
    name: 'Jellyfin_Vue:bundle_size_report',
    enforce: 'pre',
    // Only run on normal production builds, not analyze:bundle or analyze:cycles
    apply: (_, env) => env.mode === 'production',
    closeBundle: async () => {
      for (const file of globSync(`${outDir}/**/**`)) {
        const stat = await lstat(file);

        if (stat.isFile()) {
          const extension = basename(file).split('.').at(-1);
          const filenum = files.get(extension!) ?? 0;
          const size = sizes.get(extension!) ?? 0;

          files.set(extension!, filenum + 1);
          sizes.set(extension!, size + stat.size);
          totalSize += stat.size;
        }
      }

      for (const [key, val] of sizes) {
        const num = files.get(key)!;

        console.info(
          `There are ${num} ${key} ${num > 1 ? 'files' : 'file'} (${convert(val)})`
        );
      }

      console.info(`Total size of the bundle: ${convert(totalSize)}`);
    },
    configResolved: (config) => {
      outDir = normalizePath(config.build.outDir);
    }
  };
}
