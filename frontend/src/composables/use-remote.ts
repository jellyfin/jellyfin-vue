/* eslint-disable no-restricted-imports */
import { remoteInstance } from '@/plugins/vue/remote';
/* eslint-enable no-restricted-imports */

/**
 * Returns the remote plugin instance. Equivalent to using `$remote` inside
 * templates.
 */
export function useRemote(): typeof remoteInstance {
  return remoteInstance;
}
