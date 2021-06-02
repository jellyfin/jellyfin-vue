import createPersistedState from 'vuex-persistedstate';
import stores from './persistedStores';

// @ts-expect-error - Typings for store
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default ({ store }): void => {
  createPersistedState({
    key: 'vuex-store',
    paths: stores
  })(store);
};
