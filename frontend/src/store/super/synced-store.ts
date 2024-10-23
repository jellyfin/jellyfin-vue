import type { DisplayPreferencesDto } from '@jellyfin/sdk/lib/generated-client';
import { getDisplayPreferencesApi } from '@jellyfin/sdk/lib/utils/api/display-preferences-api';
import destr from 'destr';
import { EffectScope, toRaw } from 'vue';
import { watchDeep, watchImmediate } from '@vueuse/core';
import { taskManager } from '../task-manager';
import { remote } from '@/plugins/remote';
import { CommonStore, type Persistence } from '@/store/super/common-store';
import { isNil, isStr } from '@/utils/validation';
import { useSnackbar } from '@/composables/use-snackbar';
import { i18n } from '@/plugins/i18n';

export abstract class SyncedStore<T extends object> extends CommonStore<T> {
  private readonly _clientSyncName = 'vue';
  private readonly _syncedKeys: (keyof T)[] = [];
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
  private readonly _deserializeCustomPref = (value: string): unknown => {
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
        userId: remote.auth.currentUserId!,
        client: this._clientSyncName
      });

    return response.data;
  };

  private readonly _updateDisplayPreferences = async (newDisplayPreferences: DisplayPreferencesDto): Promise<void> => {
    await remote.sdk
      .newUserApi(getDisplayPreferencesApi)
      .updateDisplayPreferences({
        displayPreferencesId: this._storeKey,
        userId: remote.auth.currentUserId!,
        client: this._clientSyncName,
        displayPreferencesDto: newDisplayPreferences
      });
  };

  /**
   * Uses the keys on `defaults` to extract values from the Server's CustomPrefs
   * and de-serializes them to a value.
   * All keys needed for default should exist on the defaults parameter.
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
    if (remote.auth.currentUser) {
      /**
       * Creates a config syncing task, so UI can show that there's a syncing in progress
       */
      const syncTaskId = taskManager.startConfigSync();

      try {
        const newPrefs: DisplayPreferencesDto['CustomPrefs'] = {};

        for (const key of this._syncedKeys) {
          newPrefs[String(key)] = this._serializeCustomPref(this._state[key]);
        }

        const displayPreferences = await this._fetchDisplayPreferences();

        displayPreferences.CustomPrefs = newPrefs;
        await this._updateDisplayPreferences(displayPreferences);
      } catch {
        useSnackbar(i18n.t('failedSyncingUserSettings'), 'error');
      } finally {
        taskManager.finishTask(syncTaskId);
      }
    }
  };

  private readonly _triggerSync = async (): Promise<void> => {
    if (remote.auth.currentUser) {
      try {
        const data = await this._fetchState();

        this._effectScope.pause();

        const newState = {
          ...toRaw(this._state),
          ...data
        };

        Object.assign(this._state, newState);
        this._effectScope.resume();
      } catch {
        useSnackbar(i18n.t('failedSyncingUserSettings'), 'error');
      }
    }
  };

  /**
   * This store syncs the state of the parent store with the remote server.
   *
   * @param keys - The keys to be synced with the server. If not provided, all keys will be synced
   */
  protected constructor(storeKey: string, defaultState: T, persistence?: Persistence, keys?: (keyof T)[]) {
    super(storeKey, defaultState, persistence);
    this._syncedKeys = keys ?? [];

    if (!this._syncedKeys.length) {
      for (const key in defaultState) {
        this._syncedKeys.push(key);
      }
    }

    if (keys?.length) {
      for (const key of keys) {
        this._effectScope.run(() => {
          watchDeep(() => this._state[key], this._updateState);
        });
      }
    } else {
      this._effectScope.run(() => {
        watchDeep(() => this._state, this._updateState);
      });
    }

    /**
     * Trigger sync when the user logs in
     */
    watchImmediate(() => remote.auth.currentUser, this._triggerSync);
  }
}
