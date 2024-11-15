import { basename } from 'node:path';
import { glob, lstat } from 'node:fs/promises';
import prettyBytes from 'pretty-bytes';
import { SondaRollupPlugin } from 'sonda';
import { normalizePath, type Plugin } from 'vite';
import type { RollupLog } from 'rollup';

/**
 * This plugin extracts the logic for the analyze commands, so the main Vite config is cleaner.
 */
export function BundleAnalysis(): Plugin {
  const warnings: RollupLog[] = [];

  return {
    name: 'Jellyfin_Vue:bundle_analysis',
    enforce: 'post',
    config: (_, env) => {
      if (env.mode === 'analyze:bundle') {
        return {
          build: {
            sourcemap: true,
            rollupOptions: {
              plugins: [
                SondaRollupPlugin({
                  filename: 'dist/bundle-report.html',
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
    closeBundle: () => {
      if (warnings.length > 0) {
        for (const warning of warnings) {
          console.warn(warning);
        }

        throw new Error('There are circular dependencies');
      }
    }
  };
}

/**
 * Creates the Rollup's chunking strategy of the application (for code-splitting)
 */
export function BundleChunking(): Plugin {
  return {
    name: 'Jellyfin_Vue:bundle_chunking',
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

              if (id.includes('virtual:locales') || ((id.includes('vuetify') || id.includes('date-fns')) && id.includes('locale'))) {
                return 'localization/meta';
              }

              if (id.includes('@intlify/unplugin-vue-i18n/messages')
              ) {
                return 'localization/messages';
              }

              /**
               * Split each vendor in its own chunk
               */
              if (match) {
                return `vendor/${match.replace('@', '')}`;
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
export function BundleSizeReport(): Plugin {
  const files = new Map<string, number>();
  const sizes = new Map<string, number>();
  let outDir: string;
  let totalSize = 0;
  const convert = (bytes: number) => prettyBytes(bytes, { minimumFractionDigits: 2 });

  return {
    name: 'Jellyfin_Vue:bundle_size_report',
    apply: 'build',
    closeBundle: async () => {
      for await (const file of glob(`${outDir}/**/**`)) {
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
