import { DisplayPreferencesDto } from '@jellyfin/sdk/lib/generated-client';
import { getDisplayPreferencesApi } from '@jellyfin/sdk/lib/utils/api/display-preferences-api';
import destr from 'destr';
import { isNil } from 'lodash-es';
import { usei18n, useRemote, useSnackbar } from '@/composables';
import { taskManagerStore } from '@/store';

/**
 * Cast custom preferences returned from the server from strings to the correct Javascript type
 *
 * @param data - Response from the server
 * @param store
 */
function castDisplayPreferencesResponse<T>(
  data: DisplayPreferencesDto,
  target: T
): DisplayPreferencesDto {
  // @ts-expect-error - We need loose types here since all this logic is about properly casting the data
  const storeKeys = Object.keys(target);

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
  }

  return data.CustomPrefs || {};
}

/**
 * Fetch displayPreferences settings from server
 *
 * @param key - Key used to save the store's state
 * @param target - Object that serves as a model for the store's state
 */
export async function fetchSettingsFromServer<T>(
  key: string,
  target: T,
  cast = true
): Promise<T | DisplayPreferencesDto> {
  const remote = useRemote();

  const response = await remote.sdk
    .newUserApi(getDisplayPreferencesApi)
    .getDisplayPreferences({
      displayPreferencesId: key,
      userId: remote.auth.currentUserId || '',
      client: 'vue'
    });

  if (response.status !== 200) {
    throw new Error(
      `Unexpected API response code while fetching displayPreferences with id: ${key} (${response.status})`
    );
  }

  const data = response.data;

  return cast
    ? (castDisplayPreferencesResponse<T>(data, target) as T)
    : (response.data as DisplayPreferencesDto);
}

/**
 * Pushes a new displayPreferences payload to server
 */
export async function pushSettingsToServer(
  key: string,
  prefs: DisplayPreferencesDto
): Promise<void> {
  const remote = useRemote();

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

    const responseUpdate = await remote.sdk
      .newUserApi(getDisplayPreferencesApi)
      .updateDisplayPreferences({
        displayPreferencesId: key,
        userId: remote.auth.currentUserId || '',
        client: 'vue',
        displayPreferencesDto: prefs
      });

    if (responseUpdate.status !== 204) {
      throw new Error(
        `Unexpected API response code while pushing displayPreferences with id: ${key} (${responseUpdate.status})`
      );
    }
  } else {
    throw new Error(`DisplayPreferences data is malformed`);
  }
}

/**
 * This watcher provides a generic way to sync stores' state to the server.
 * Make sure your store implements a 'lastSync' property of type 'number | null'
 *
 * It will automatically be synced when a property changes.
 */
export default async function preferencesSync<T>(
  key: string,
  state: T
): Promise<void> {
  const auth = useRemote().auth;
  const { t } = usei18n();
  const taskManager = taskManagerStore();

  if (!isNil(auth.currentUser)) {
    try {
      /**
       * Creates a config syncing task, so UI can show that there's a syncing in progress
       */
      taskManager.startConfigSync();

      /**
       * The fetch part is done because DisplayPreferences doesn't accept partial updates
       * TODO: Revisit if we ever get PATCH support
       */
      const displayPrefs = (await fetchSettingsFromServer(
        key,
        state,
        false
      )) as DisplayPreferencesDto;

      displayPrefs.CustomPrefs = {};

      Object.assign(displayPrefs.CustomPrefs, state);
      await pushSettingsToServer(key, displayPrefs);
    } catch {
      useSnackbar(t('failedSettingDisplayPreferences'), 'error');
    } finally {
      taskManager.stopConfigSync();
    }
  }
}
