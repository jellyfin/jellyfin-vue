import { basename, resolve, join } from 'node:path';
import { globSync } from 'node:fs';
import { lstat, rename, rm } from 'node:fs/promises';
import type { LiteralUnion } from 'type-fest';
import prettyBytes from 'pretty-bytes';
import Sonda from 'sonda/rollup';
import { normalizePath, preview, type Plugin, type Rolldown } from 'vite';

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
  const warnings: Rolldown.RolldownLog = [];

  return {
    name: 'Jellyfin_Vue:bundle_analysis',
    enforce: 'pre',
    config: (_, env) => {
      mode = env.mode;

      if (env.mode === 'analyze:bundle') {
        return {
          build: {
            sourcemap: true,
            rolldownOptions: {
              plugins: [
                Sonda({
                  open: false,
                  outputDir: defaultConfig.build.outDir,
                  deep: true,
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
            rolldownOptions: {
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
        const src = resolve(defaultConfig.build.outDir);

        await rm(join(src, 'index.html'));

        for (const file of globSync(join(src, '**/*'))) {
          await (file.includes('sonda') ? rename(file, resolve(defaultConfig.build.outDir, 'index.html')) : rm(file, { force: true, recursive: true }));
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
            strictExecutionOrder: true,
            /**
             * This is the first thing that should be debugged when there are issues
             * with the bundle.
             */
            codeSplitting: {
              groups: [
                {
                  /**
                   * Split each vendor in its own chunk
                   */
                  name: (id) => {
                    const normalizedId = id.replaceAll('\\', '/');
                    const nodeModulesPrefix = 'node_modules/';
                    const nodeModulesIndex = normalizedId.lastIndexOf(nodeModulesPrefix);

                    if (nodeModulesIndex === -1) {
                      return;
                    }

                    const packageName = normalizedId.slice(nodeModulesIndex + nodeModulesPrefix.length).split('/')[0];

                    if (!packageName) {
                      return;
                    }

                    return `vendor/${packageName.replace('@', '')}`;
                  },
                  priority: 10
                },
                {
                  /**
                   * Split Vuetify localization into separate chunk
                   */
                  name: 'localization/vendor/vuetify',
                  test: /virtual:.*locales[\\/]vuetify/,
                  priority: 9
                },
                {
                  /**
                   * Split Date-fns localization into separate chunk
                   */
                  name: 'localization/vendor/date-fns',
                  test: /virtual:.*locales[\\/]date-fns/,
                  priority: 9
                },
                {
                  /**
                   * Split i18next resources into separate chunks
                   */
                  name: (id) => {
                    if (id.includes('virtual:') || id.includes('i18next/resources')) {
                      const targetPath = basename(id.split('/').at(-1)!);
                      const isIndex = targetPath === 'resources';

                      return isIndex ? 'localization' : `localization/strings/${targetPath}`;
                    }
                  },
                  priority: 8
                }
              ]
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
