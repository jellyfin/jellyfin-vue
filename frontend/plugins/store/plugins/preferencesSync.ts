import { DisplayPreferencesDto } from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import destr from 'destr';
import { isNil } from 'lodash';
import { PiniaPluginContext } from 'pinia';
import { authStore, pageStore, snackbarStore } from '~/store';

const syncedStores = ['clientSettings'];

/**
 * Cast custom preferences returned from the server from strings to the correct Javascript type
 *
 * @param {DisplayPreferencesDto} data - Response from the server
 */
function castDisplayPreferencesResponse(
  data: DisplayPreferencesDto
): DisplayPreferencesDto {
  if (data.CustomPrefs) {
    for (const [key, value] of Object.entries(data.CustomPrefs)) {
      /**
       * destr does proper conversion for all the types, even undefined
       */

      data.CustomPrefs[key] = destr(value);
    }

    return data;
  }

  return {};
}

/**
 * Fetches settings from server
 */
export async function fetchSettingsFromServer(
  ctx: Context,
  auth: ReturnType<typeof authStore>,
  storeId: string,
  cast = true
): Promise<DisplayPreferencesDto> {
  const response = await ctx.$api.displayPreferences.getDisplayPreferences({
    displayPreferencesId: storeId,
    userId: auth.currentUserId,
    client: 'vue'
  });

  if (response.status !== 200) {
    throw new Error(
      `Unexpected API response code while fetching displayPreferences with id: ${storeId} (${response.status})`
    );
  }

  return cast ? castDisplayPreferencesResponse(response.data) : response.data;
}

async function pushSettingsToServer(
  ctx: Context,
  auth: ReturnType<typeof authStore>,
  storeId: string,
  prefs: DisplayPreferencesDto
): Promise<void> {
  if (prefs.CustomPrefs) {
    for (const [key, value] of Object.entries(prefs.CustomPrefs)) {
      let string = JSON.stringify(value);

      /**
       * Undefined can't be converted to string using JSON.stringify so we add this safeguard
       */
      if (typeof string !== 'string') {
        string = String(string);
      }

      prefs.CustomPrefs[key] = string;
    }

    const responseUpdate =
      await ctx.$api.displayPreferences.updateDisplayPreferences({
        displayPreferencesId: storeId,
        userId: auth.currentUserId,
        client: 'vue',
        displayPreferencesDto: prefs
      });

    if (responseUpdate.status !== 204) {
      throw new Error(
        `Unexpected API response code while pushing displayPreferences with id: ${storeId} (${responseUpdate.status})`
      );
    }
  } else {
    throw new Error(`Data is malformed or there is no user logged in`);
  }
}

/**
 * This watcher provides a generic way to sync stores' state to the server.
 * Make sure your store implements a 'lastSync' property of type 'number | null'
 *
 * It will automatically be synced when a property changes.
 */
export default function preferencesSync({ store }: PiniaPluginContext) {
  if (syncedStores.includes(store.$id)) {
    const page = pageStore();
    const auth = authStore();
    const snackbar = snackbarStore();
    store.$subscribe(async () => {
      if (!isNil(auth.currentUser)) {
        try {
          /**
           * Set the state of the page to syncing, so UI can show that there's a syncing in progress
           */
          page.startSync();
          /**
           * We set a new last sync date at the start, so if the push fails, we still have the last attempt's
           * date and we can compare with the server when we're back online
           */
          store.$state.lastSync = Date.now();

          /**
           * The fetch part is done because DisplayPreferences doesn't accept partial updates
           * TODO: Revisit if we ever get PATCH support
           */
          const displayPrefs = await fetchSettingsFromServer(
            store.$nuxt,
            auth,
            store.$id,
            false
          );
          displayPrefs.CustomPrefs = {};

          const settings = store.state;
          Object.assign(displayPrefs.CustomPrefs, settings);
          pushSettingsToServer(store.$nuxt, auth, store.$id, displayPrefs);
        } catch (error) {
          snackbar.push(
            store.$nuxt.i18n.t('failedSettingDisplayPreferences'),
            'error'
          );
        } finally {
          page.stopSync();
        }
      }
    });
  }
}
