// eslint-disable-next-line no-restricted-imports
import { remoteInstance } from '@/plugins/remote';

/**
 * Returns the remote plugin instance. Equivalent to using `$remote` inside
 * templates.
 *
 * Also needed when used outside setup functions or anywhere else
 * outside the Vue app instance.
 */
export function useRemote(): typeof remoteInstance {
  return remoteInstance;
}
