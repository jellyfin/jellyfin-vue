import { computed } from 'vue';
import { sealed } from '@jellyfin-vue/shared/validation';
import type { KeysOfUnion } from 'type-fest';
import { SyncedStore } from '#/store/super/synced-store.ts';

const HOME_SECTION_KEYS = [
  'homesection0',
  'homesection1',
  'homesection2',
  'homesection3',
  'homesection4',
  'homesection5',
  'homesection6',
  'homesection7',
  'homesection8',
  'homesection9'
] as const;

/**
 * == INTERFACES AND TYPES ==
 * Casted typings for the CustomPrefs property of DisplayPreferencesDto
 */

export type HomeSectionKey = typeof HOME_SECTION_KEYS[number];
export type UserSettingsState = Record<HomeSectionKey, string> & {
  libraryOrder: string[];
};

@sealed
class UserSettingsStore extends SyncedStore<UserSettingsState, KeysOfUnion<UserSettingsState>> {
  public readonly libraryOrder = computed({
    get: () => this._state.value.libraryOrder,
    set: (newVal: string[]) => {
      this._state.value.libraryOrder = newVal;
    }
  });

  public readonly homeSections = computed({
    get: () => HOME_SECTION_KEYS.map(key => this._state.value[key]),
    set: (newVal: string[]) => {
      for (const [index, key] of HOME_SECTION_KEYS.entries()) {
        this._state.value[key] = newVal[index] ?? 'none';
      }
    }
  });

  public constructor() {
    super({
      storeKey: 'userSettings',
      defaultState: () => ({
        homesection0: 'smalllibrarytiles',
        homesection1: 'resumevideo',
        homesection2: 'nextup',
        homesection3: 'latestmedia',
        homesection4: 'none',
        homesection5: 'none',
        homesection6: 'none',
        homesection7: 'none',
        homesection8: 'none',
        homesection9: 'none',
        libraryOrder: [] as string[]
      }),
      resetOnLogout: true,
      persistenceType: 'localStorage'
    });
  }
}

export const userSettings = new UserSettingsStore();
