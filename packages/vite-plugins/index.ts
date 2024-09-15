import { visualizer } from 'rollup-plugin-visualizer';
import type { RollupLog } from 'rollup';
import type { Plugin } from 'vite';

/**
 * This plugin extracts the logic for the analyze commands, so the main Vite config is cleaner.
 */
export function JellyfinVueAnalysis(): Plugin {
  const warnings: RollupLog[] = [];

  return {
    name: 'Jellyfin_Vue:analysis',
    enforce: 'post',
    config: (_, env) => {
      if (env.mode === 'analyze:bundle') {
        return {
          build: {
            rollupOptions: {
              plugins: [
                visualizer({
                  open: true,
                  filename: 'dist/stats.html'
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
export function JellyfinVueChunking(): Plugin {
  return {
    name: 'Jellyfin_Vue:chunking',
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
