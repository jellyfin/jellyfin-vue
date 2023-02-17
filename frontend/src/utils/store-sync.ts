import { DisplayPreferencesDto } from '@jellyfin/sdk/lib/generated-client';
import { getDisplayPreferencesApi } from '@jellyfin/sdk/lib/utils/api/display-preferences-api';
import destr from 'destr';
import { usei18n, useRemote, useSnackbar } from '@/composables';
import { taskManagerStore } from '@/store';

const CLIENT = 'vue';

/**
 * Serializes custom pref values for storage as string
 */
function serializeCustomPref(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * De-serializes custom pref values from string to a value
 */
function deserializeCustomPref(value: string): unknown {
  return destr(value);
}

/**
 * Fetches server display preferences
 */
export async function fetchDisplayPreferences(
  displayPreferencesId: string
): Promise<DisplayPreferencesDto> {
  const remote = useRemote();

  const response = await remote.sdk
    .newUserApi(getDisplayPreferencesApi)
    .getDisplayPreferences({
      displayPreferencesId,
      userId: remote.auth.currentUserId ?? '',
      client: CLIENT
    });

  if (response.status !== 200) {
    throw new Error(
      `Unexpected API response code while fetching displayPreferences with id: ${displayPreferencesId} (${response.status})`
    );
  }

  return response.data;
}

/**
 * Display preferences must be merged based on latest state before being updated.
 * For some reason Jellyfin does not allow partial updates for display preferences.
 */
export async function updateDisplayPreferences(
  displayPreferencesId: string,
  displayPreferences: DisplayPreferencesDto
): Promise<void> {
  const remote = useRemote();

  const currentDisplayPreferences = await fetchDisplayPreferences(
    displayPreferencesId
  );

  const newDisplayPreferences = Object.assign(
    {},
    currentDisplayPreferences,
    displayPreferences
  );

  // if either old or new preferences have custom settings, merge them
  if (
    currentDisplayPreferences.CustomPrefs !== undefined ||
    newDisplayPreferences.CustomPrefs !== undefined
  ) {
    const mergedCustomPrefs = Object.assign(
      {},
      currentDisplayPreferences.CustomPrefs ?? {},
      displayPreferences.CustomPrefs ?? {}
    );

    newDisplayPreferences.CustomPrefs = Object.fromEntries(
      Object.entries(mergedCustomPrefs)
        .map(([key, value]) => [key, serializeCustomPref(value)])
        .filter(([, value]) => value !== undefined)
    );
  }

  const response = await remote.sdk
    .newUserApi(getDisplayPreferencesApi)
    .updateDisplayPreferences({
      displayPreferencesId,
      userId: remote.auth.currentUserId ?? '',
      client: CLIENT,
      displayPreferencesDto: newDisplayPreferences
    });

  if (response.status !== 204) {
    throw new Error(
      `Unexpected API response code while pushing displayPreferences with id: ${displayPreferencesId} (${response.status})`
    );
  }
}

/**
 * Uses the keys on `defaults` to extract values from the Server's CustomPrefs
 * and de-serializes them to a value.
 * All keys needed for default should exist on the defaults parameter.
 * Warning: No runtime checking is performed and de-serialized data could vary in shape from what is expected.
 */
export async function fetchDefaultedCustomPrefs<T extends object>(
  displayPreferencesId: string,
  defaults: T
): Promise<T> {
  const displayPreferences = await fetchDisplayPreferences(
    displayPreferencesId
  );

  return Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => [
      k,
      displayPreferences.CustomPrefs && k in displayPreferences.CustomPrefs
        ? deserializeCustomPref(displayPreferences.CustomPrefs?.[k])
        : v
    ])
  ) as T;
}

/**
 * Updates CustomPrefs by merging passed in value with existing custom prefs
 */
export async function updateCustomPrefs<T extends object>(
  displayPreferencesId: string,
  customPrefs: T
): Promise<void> {
  const remote = useRemote();

  const displayPreferences = await fetchDisplayPreferences(
    displayPreferencesId
  );

  displayPreferences.CustomPrefs = Object.assign(
    displayPreferences.CustomPrefs ?? {},
    customPrefs
  );

  displayPreferences.CustomPrefs = Object.fromEntries(
    Object.entries(displayPreferences.CustomPrefs)
      .map(([key, value]) => [key, serializeCustomPref(value)])
      .filter(([, value]) => value !== undefined)
  );

  const response = await remote.sdk
    .newUserApi(getDisplayPreferencesApi)
    .updateDisplayPreferences({
      displayPreferencesId,
      userId: remote.auth.currentUserId ?? '',
      client: CLIENT,
      displayPreferencesDto: displayPreferences
    });

  if (response.status !== 204) {
    throw new Error(
      `Unexpected API response code while pushing displayPreferences with id: ${displayPreferencesId} (${response.status})`
    );
  }
}

/**
 * Wraps custom pref syncing in a task with error handling
 */
export async function syncCustomPrefs<T extends object>(
  displayPreferencesId: string,
  customPrefs: T
): Promise<void> {
  const { t } = usei18n();
  const taskManager = taskManagerStore();

  /**
   * Creates a config syncing task, so UI can show that there's a syncing in progress
   */
  const syncTaskId = taskManager.startConfigSync();

  try {
    await updateCustomPrefs(displayPreferencesId, customPrefs);
  } catch {
    useSnackbar(t('failedSettingDisplayPreferences'), 'error');
  } finally {
    taskManager.finishTask(syncTaskId);
  }
}
