import { DisplayPreferencesDto } from '@jellyfin/client-axios';
import { Plugin } from 'vuex';
import { AppState } from '~/store';
import { syncedMutations } from '~/store/clientSettings';

export const preferencesSync: Plugin<AppState> = (store) => {
  store.subscribe(async (mutation) => {
    if (
      syncedMutations.some((syncedMutation) =>
        mutation.type.includes(syncedMutation)
      ) &&
      store.$auth.loggedIn
    ) {
      try {
        await store.dispatch('setSyncStatus', true);
        // We set a new last sync date at the start, so if the push fails, we still have the last attempt's
        // date and we can compare with the server when we're back online
        await store.dispatch('clientSettings/setLastSyncDate');

        // The fetch part is done because DisplayPreferences doesn't accept partial updates
        const response = await store.$api.displayPreferences.getDisplayPreferences(
          {
            displayPreferencesId: 'clientsettings',
            userId: store.$auth.user?.Id,
            client: 'vue'
          }
        );

        if (response.status !== 200) {
          throw new Error(
            `Unexpected API response code while pushing client preferences (${response.status})`
          );
        }

        const displayPrefs = response.data;
        displayPrefs.CustomPrefs = {};

        const settings = store.state.clientSettings;

        /**
         * vuex-persistedstate adds an 'status' variable to the rootState. We need to get rid of it.
         */
        // @ts-expect-error - vuex-persistedstate doesn't define its types for this
        if (settings.status) {
          // @ts-expect-error - vuex-persistedstate doesn't define its types for this
          delete settings.status;
        }

        Object.assign(displayPrefs.CustomPrefs, store.state.clientSettings);

        for (const [key, value] of Object.entries(displayPrefs.CustomPrefs)) {
          let string = JSON.stringify(value);
          /**
           * Undefined can't be converted to string using JSON.stringify so we add this safeguard
           */
          if (typeof string !== 'string') {
            string = String(string);
          }
          displayPrefs.CustomPrefs[key] = string;
        }

        const responseUpdate = await store.$api.displayPreferences.updateDisplayPreferences(
          {
            displayPreferencesId: 'clientsettings',
            userId: store.$auth.user?.Id,
            client: 'vue',
            displayPreferencesDto: displayPrefs as DisplayPreferencesDto
          }
        );

        if (responseUpdate.status !== 204) {
          throw new Error(
            `pushState(update): Unexpected API response code (${response.status})`
          );
        }
      } catch (error) {
        const message = store.$i18n.t('failedSettingDisplayPreferences');
        store.dispatch(
          'snackbar/pushSnackbarMessage',
          {
            message,
            color: 'error'
          },
          { root: true }
        );
      } finally {
        await store.dispatch('setSyncStatus', false);
      }
    }
  });
};
