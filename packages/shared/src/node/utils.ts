import { dirname } from 'node:path';
import { createRequire } from 'node:module';

/**
 * Gets the path of a monorepo package
 */
export function getPackagePath(packageName: string): string {
  const require = createRequire(import.meta.url);

  return dirname(require.resolve(packageName));
}
