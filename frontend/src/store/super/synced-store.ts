import type { DisplayPreferencesDto } from '@jellyfin/sdk/lib/generated-client';
import { getDisplayPreferencesApi } from '@jellyfin/sdk/lib/utils/api/display-preferences-api';
import destr from 'destr';
import { deepEqual } from 'fast-equals';
import { computed, EffectScope, watch } from 'vue';
import { watchDeep } from '@vueuse/core';
import type { UnknownRecord } from 'type-fest';
import { isNil, isStr } from '@jellyfin-vue/shared/validation';
import i18next from 'i18next';
import { taskManager } from '../task-manager';
import { remote } from '#/plugins/remote';
import { CommonStore, type CommonStoreParams } from '#/store/super/common-store';
import { useSnackbar } from '#/composables/use-snackbar';
import { pick } from '#/utils/data-manipulation';

export abstract class SyncedStore<
  T extends object = UnknownRecord,
  K extends keyof T = never
> extends CommonStore<T, K> {
  private readonly _clientSyncName = 'vue';
  private readonly _syncedKeys: Set<(keyof T)>;
  private readonly _effectScope = new EffectScope();
  /**
   * Serializes custom pref values for storage as string
   */
  private readonly _serializeCustomPref = (value: unknown): string => {
    return isStr(value) ? value : JSON.stringify(value);
  };

  /**
   * De-serializes custom pref values from string to a value
   */
  private readonly _deserializeCustomPref = (value: Nullish<string>): unknown => {
    return destr(value);
  };

  /**
   * Fetches server display preferences
   */
  private readonly _fetchDisplayPreferences = async (): Promise<DisplayPreferencesDto> => {
    const response = await remote.sdk
      .newUserApi(getDisplayPreferencesApi)
      .getDisplayPreferences({
        displayPreferencesId: this._storeKey,
        userId: remote.auth.currentUserId.value,
        client: this._clientSyncName
      });

    return response.data;
  };

  private readonly _updateDisplayPreferences = async (newDisplayPreferences: DisplayPreferencesDto): Promise<void> => {
    await remote.sdk
      .newUserApi(getDisplayPreferencesApi)
      .updateDisplayPreferences({
        displayPreferencesId: this._storeKey,
        userId: remote.auth.currentUserId.value,
        client: this._clientSyncName,
        displayPreferencesDto: newDisplayPreferences
      });
  };

  /**
   * Fetch keys from server and deserializes them to primitives.
   *
   * Warning: No runtime checking is performed and de-serialized data could vary in shape from what is expected.
   */
  private readonly _fetchState = async (): Promise<Partial<T>> => {
    const displayPreferences = await this._fetchDisplayPreferences();
    const newState = {} as Partial<T>;

    for (const key of this._syncedKeys) {
      const obj = displayPreferences.CustomPrefs?.[String(key)];

      if (!isNil(obj)) {
        newState[key] = this._deserializeCustomPref(obj) as T[keyof T];
      }
    }

    return newState;
  };

  /**
   * Updates CustomPrefs by merging passed in value with existing custom prefs
   */
  private readonly _updateState = async (): Promise<void> => {
    if (remote.auth.currentUser.value) {
      /**
       * Creates a config syncing task, so UI can show that there's a syncing in progress
       */
      const syncTaskId = taskManager.startConfigSync();

      try {
        const newPrefs: DisplayPreferencesDto['CustomPrefs'] = {};

        for (const key of this._syncedKeys) {
          newPrefs[String(key)] = this._serializeCustomPref(this._state.value[key]);
        }

        const displayPreferences = await this._fetchDisplayPreferences();

        displayPreferences.CustomPrefs = newPrefs;
        await this._updateDisplayPreferences(displayPreferences);
      } catch {
        useSnackbar(i18next.t('failedSyncingUserSettings'), 'error');
      } finally {
        taskManager.finishTask(syncTaskId);
      }
    }
  };

  private readonly _triggerSync = async (): Promise<void> => {
    if (remote.auth.currentUser.value) {
      try {
        const data = await this._fetchState();

        this._effectScope.pause();

        const newState = {
          ...this._state.value,
          ...data
        };

        this._state.value = newState;
        this._effectScope.resume();
      } catch {
        useSnackbar(i18next.t('failedSyncingUserSettings'), 'error');
      }
    }
  };

  /**
   * This store syncs the state of the parent store with the remote server.
   *
   * @param keys - The keys to be synced with the server. If not provided, all keys will be synced
   */
  protected constructor(
    commonStoreParams: CommonStoreParams<T>,
    syncedKeys?: Set<(keyof T)>
  ) {
    super(commonStoreParams);
    this._syncedKeys = syncedKeys ?? new Set(Object.keys(commonStoreParams.defaultState()) as (keyof T)[]);

    const synced_object = computed<Pick<T, keyof T>>((previous) => {
      const picked = pick(this._state.value, this._syncedKeys);

      return previous && deepEqual(previous, picked) ? previous : picked;
    });

    this._effectScope.run(() => {
      watchDeep(synced_object, this._updateState);
    });

    watch(remote.auth.currentUser, this._triggerSync);
  }
}
