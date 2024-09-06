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
