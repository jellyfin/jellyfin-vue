import { Plugin } from '@nuxt/types';
import createPersistedState from 'vuex-persistedstate';
import Cookies from 'js-cookie';

/**
 * Stores that will be persisted to localStorage
 */
const StorageStores = [
  'deviceProfile',
  'clientSettings',
  'i18n',
  'servers',
  'user'
];
/**
 * Stores that will be persisted to cookies
 */
const CookieStores = ['auth'];

const persistedStatePlugin: Plugin = ({ store }) => {
  createPersistedState({
    key: 'vuex',
    paths: StorageStores,
    overwrite: false,
    fetchBeforeUse: true
  })(store);
  createPersistedState({
    key: 'vuex',
    paths: CookieStores,
    overwrite: false,
    fetchBeforeUse: true,
    storage: {
      getItem: (key: string): string | undefined => {
        return Cookies.get(key);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setItem: (key: string, value: any): void => {
        Cookies.set(key, value, { expires: 365 });
      },
      removeItem: (key: string): void => Cookies.remove(key)
    }
  })(store);
};

export default persistedStatePlugin;
