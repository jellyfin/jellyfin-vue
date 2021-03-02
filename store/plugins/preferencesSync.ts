import { Plugin } from 'vuex';
import { AppState } from '..';

export const preferencesSync: Plugin<AppState> = (store) => {
  store.subscribe((mutation) => {
    if (mutation.type.includes('settings/')) {
      store.dispatch('displayPreferencesApi/updateSettings', null, {
        root: true
      });
    }
  });
};
