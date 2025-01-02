import type { ComponentResolver } from 'unplugin-vue-components/types';
import pkg from '../package.json' with { type: 'json' };

/**
 * Resolver for unplugin-vue-components
 */
export function JellyfinVueUIToolkit(): ComponentResolver {
  return {
    type: 'component',
    resolve: (name: string) => {
      if (/^J[A-Z]/.test(name)) {
        return {
          name,
          from: `${pkg.name}/components`
        };
      }
    }
  };
}
