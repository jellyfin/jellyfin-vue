import destr from 'destr';
import { PiniaPluginContext } from 'pinia';

localStorage.removeItem('vuex');

/**
 * Stores that will be persisted to localStorage
 */
const storageStores = ['deviceProfile', 'clientSettings', 'auth'];

export default function persistence({ store }: PiniaPluginContext) {
  if (storageStores.includes(store.$id)) {
    store.$state = destr(localStorage.getItem(store.$id));
    store.$subscribe(() => {
      localStorage.setItem(store.$id, JSON.stringify(store.$state));
    });
  }
}
