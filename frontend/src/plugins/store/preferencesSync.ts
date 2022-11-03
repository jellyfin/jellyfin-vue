import { DisplayPreferencesDto } from '@jellyfin/client-axios';
import destr from 'destr';
import isNil from 'lodash/isNil';
import {
  PiniaPluginContext,
  StateTree,
  Store,
  _ActionsTree,
  _GettersTree
} from 'pinia';
import { authStore, snackbarStore, taskManagerStore } from '~/store';

const syncedStores = ['clientSettings'];

/**
 * Cast custom preferences returned from the server from strings to the correct Javascript type
 *
 * @param data - Response from the server
 * @param store
 */
function castDisplayPreferencesResponse(
  data: DisplayPreferencesDto,
  store: Store<string, StateTree, _GettersTree<StateTree>, _ActionsTree>
): DisplayPreferencesDto {
  const storeKeys = Object.keys(store.$state);

  if (data.CustomPrefs) {
    for (const [key, value] of Object.entries(data.CustomPrefs)) {
      /**
       * destr does proper conversion for all the types, even undefined
       */
      if (storeKeys.includes(key)) {
        data.CustomPrefs[key] = destr(value);
      } else {
        /**
         * Remove properties that are automatically present in the server but are not present in the store.
         */
        delete data.CustomPrefs[key];
      }
    }

    return data;
  }

  return {};
}

/**
 * Fetches settings from server
 *
 * @param ctx
 * @param auth
 * @param store
 * @param cast
 */
export async function fetchSettingsFromServer(
  ctx: Context,
  auth: ReturnType<typeof authStore>,
  store: Store<string, StateTree, _GettersTree<StateTree>, _ActionsTree>,
  cast = true
): Promise<DisplayPreferencesDto> {
  const response = await ctx.$api.displayPreferences.getDisplayPreferences({
    displayPreferencesId: store.$id,
    userId: auth.currentUserId,
    client: 'vue'
  });

  if (response.status !== 200) {
    throw new Error(
      `Unexpected API response code while fetching displayPreferences with id: ${store.$id} (${response.status})`
    );
  }

  return cast
    ? castDisplayPreferencesResponse(response.data, store)
    : response.data;
}

/**
 * @param ctx
 * @param auth
 * @param storeId
 * @param prefs
 */
export async function pushSettingsToServer(
  ctx: Context,
  auth: ReturnType<typeof authStore>,
  storeId: string,
  prefs: DisplayPreferencesDto
): Promise<void> {
  if (prefs.CustomPrefs) {
    for (const [key, value] of Object.entries(prefs.CustomPrefs)) {
      let string = value;

      if (typeof value !== 'string') {
        string = JSON.stringify(value);
      }

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
 *
 */
export default function preferencesSync({ store }: PiniaPluginContext): void {
  if (syncedStores.includes(store.$id)) {
    const auth = authStore();
    const snackbar = snackbarStore();
    const taskManager = taskManagerStore();

    store.$onAction(({ after, name }) => {
      after(async () => {
        if (name !== 'initState') {
          if (!isNil(auth.currentUser)) {
            try {
              /**
               * Creates a config syncing task, so UI can show that there's a syncing in progress
               */
              taskManager.startConfigSync();
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
                store,
                false
              );

              displayPrefs.CustomPrefs = {};

              Object.assign(displayPrefs.CustomPrefs, store.$state);
              pushSettingsToServer(store.$nuxt, auth, store.$id, displayPrefs);
            } catch (error) {
              snackbar.push(
                store.$nuxt.i18n.t('failedSettingDisplayPreferences'),
                'error'
              );
            } finally {
              taskManager.stopConfigSync();
            }
          }
        }
      });
    });
  }
}
