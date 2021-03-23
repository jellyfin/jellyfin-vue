import { Plugin } from '@nuxt/types';
import createPersistedState from 'vuex-persistedstate';
import Cookies from 'js-cookie';
import cookie from 'cookie';

const persistState: Plugin = ({ store, req, res }) => {
  createPersistedState({
    paths: ['servers'],
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
};

export default persistState;
