import destr from 'destr';
import { PiniaPluginContext } from 'pinia';

/**
 * Stores that will be persisted to localStorage
 */
const storageStores = new Set(['clientSettings']);

/**
 * When every store is used for the first time, this function will be called.
 * It will hydrate it's data from localStorage and setup a subscription handler
 * to save data back to localStorage when needed.
 */
export default function persistence({ store }: PiniaPluginContext): void {
  if (storageStores.has(store.$id)) {
    store.$state = destr(localStorage.getItem(store.$id));
    store.$subscribe(() => {
      localStorage.setItem(store.$id, JSON.stringify(store.$state));
    });
  }
}
