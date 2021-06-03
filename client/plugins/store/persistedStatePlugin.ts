import { Plugin } from '@nuxt/types';
import createPersistedState from 'vuex-persistedstate';
import Cookies from 'js-cookie';
import cookie from 'cookie';
import destr from 'destr';

const SPAStores = ['deviceProfile', 'clientSettings', 'i18n'];
const SSRStores = ['user', 'servers', 'auth'];

const persistedStatePlugin: Plugin = ({ store, req, res }) => {
  /**
   * Checks if client was built with SSR or as an SPA application.
   *
   * process.server or process.browser lets us distinguish between both environments when running SSR,
   * but the check client-side just lets us know that we're in the browser environment, without further
   * information on whether browser there's SSR behind the scenes.
   *
   * A hardcoded variable provides us that information, which helps us to manage the Vuex persisted storage properly
   * by saving all the store's information in localStorage when the client is fully SPA and combining cookies and localStorage
   * when using SSR, as SSR rendering needs the server to have access to the authentication data so the redirection
   * middleware acts accordingly.
   *
   * Cookies pollutes a lo the headers of the clients and are problematic privacy-wise, so it's a good idea to avoid using them
   * as long as they're not necessary, hence all of this.
   */
  const isSSR = destr(process?.env?.NUXT_SSR);

  if (!process.server) {
    createPersistedState({
      key: 'vuex',
      paths: isSSR ? SPAStores : SPAStores.concat(SSRStores),
      overwrite: false,
      fetchBeforeUse: true
    })(store);
  } else {
    createPersistedState({
      key: 'vuex-auth',
      paths: SSRStores,
      overwrite: false,
      fetchBeforeUse: true,
      storage: {
        getItem: (key: string): string | undefined => {
          if (process.server) {
            const parsedCookies = cookie.parse(req.headers.cookie || '');

            return parsedCookies[key];
          } else {
            return Cookies.get(key);
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setItem: (key: string, value: any): void => {
          if (process.server) {
            res.setHeader(
              'Set-Cookie',
              cookie.serialize(key, value, { maxAge: 365 })
            );
          } else {
            Cookies.set(key, value, { expires: 365 });
          }
        },
        removeItem: (key: string): void => Cookies.remove(key)
      }
    })(store);
  }
};

export default persistedStatePlugin;
