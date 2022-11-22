import { remoteInstance } from '@/plugins/vue/remote';
import { RemotePlugin } from '@/plugins/vue/remote/types';

/**
 * Returns the remote plugin instance. Equivalent to using `$remote` inside
 * templates.
 */
export function useRemote(): RemotePlugin {
  return remoteInstance;
}
