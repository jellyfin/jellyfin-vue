/**
 * This files provides a generic way to sync settings stores to the server.
 * Make sure your store implements the INIT_STATE, RESET_STATE and SET_LAST_SYNC_DATE
 * mutations, and add it to the syncedStores array below.
 *
 * It will automatically be synced on login and to the server when a property changes.
 */

// TODO: Add JSDoc tutorial on how to use this.

import { DisplayPreferencesDto } from '@jellyfin/client-axios';
import { Plugin } from 'vuex';
import { AppState } from '~/store';

/**
 * A list of synced stores.
 * Usually simply the name of the Vuex submodule.
 */
export const syncedStores = ['clientSettings'];

/**
 * A list of standard settings store mutations which never get synced to the server.
 * Usually concerns state initialization or reset and sync-related state.
 */
export const blacklistedMutations = [
  'INIT_STATE',
  'RESET_STATE',
  'SET_LAST_SYNC_DATE'
];

export const preferencesSync: Plugin<AppState> = (store) => {
  store.subscribe(async (mutation) => {
    if (
      syncedStores.some((syncedStores) =>
        mutation.type.startsWith(syncedStores)
      ) &&
      !blacklistedMutations.some((blacklistedMutations) =>
        mutation.type.endsWith(blacklistedMutations)
      ) &&
      store.$auth.loggedIn
    ) {
      const [subModule] = mutation.type.split('/');

      try {
        await store.dispatch('taskManager/setConfigSyncStatus', true);
        // We set a new last sync date at the start, so if the push fails, we still have the last attempt's
        // date and we can compare with the server when we're back online
        await store.dispatch(`${subModule}/setLastSyncDate`);

        // The fetch part is done because DisplayPreferences doesn't accept partial updates
        // TODO: Revisit if we ever get PATCH support
        const response =
          await store.$api.displayPreferences.getDisplayPreferences({
            displayPreferencesId: subModule,
            userId: store.$auth.user?.Id,
            client: 'vue'
          });

        if (response.status !== 200) {
          throw new Error(
            `Unexpected API response code while pushing ${subModule} store (${response.status})`
          );
        }

        const displayPrefs = response.data;

        displayPrefs.CustomPrefs = {};

        // @ts-expect-error - We need a generic way to access the submodule. A string works here, despite TypeScript's protests.
        const settings = store.state[subModule];

        /**
         * Something adds an 'status' variable to the state. We need to get rid of it.
         */
        // TODO: Figure out why this happens and if we can disable it
        if (settings.status) {
          delete settings.status;
        }

        Object.assign(displayPrefs.CustomPrefs, settings);

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

        const responseUpdate =
          await store.$api.displayPreferences.updateDisplayPreferences({
            displayPreferencesId: subModule,
            userId: store.$auth.user?.Id,
            client: 'vue',
            displayPreferencesDto: displayPrefs as DisplayPreferencesDto
          });

        if (responseUpdate.status !== 204) {
          throw new Error(
            `Unexpected API response code while pushing ${subModule} store (${response.status})`
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
        await store.dispatch('taskManager/setConfigSyncStatus', false);
      }
    }
  });
};
