import type { KeysOfUnion, LiteralUnion } from 'type-fest';
import { sealed } from '@jellyfin-vue/shared/validation';
import { SyncedStore } from '#/store/super/synced-store';

/**
 * == INTERFACES AND TYPES ==
 */
export type SubtitleTypographyChoices = 'default' | 'system' | 'auto';
export interface SubtitleSettingsState {
  /**
   * Whether the customization of the subtitles is enabled or not
   * @default: false
   */
  enabled: boolean;
  /**
   * default: Default application typography.
   *
   * system: System typography
   *
   * auto: Selects the current selected typography for the application
   * @default auto
   */
  fontFamily: LiteralUnion<SubtitleTypographyChoices, string>;
  fontSize: number;
  positionFromBottom: number;
  backdrop: boolean;
  stroke: boolean;
}

@sealed
class SubtitleSettingsStore extends SyncedStore<SubtitleSettingsState, KeysOfUnion<SubtitleSettingsState>> {
  public constructor() {
    super({
      storeKey: 'subtitleSettings',
      defaultState: () => ({
        enabled: false,
        fontFamily: 'auto',
        fontSize: 1.5,
        positionFromBottom: 10,
        backdrop: true,
        stroke: false
      }),
      persistenceType: 'localStorage',
      resetOnLogout: true
    }, new Set([
      'enabled',
      'fontSize',
      'positionFromBottom',
      'backdrop',
      'stroke'
    ]));
  }
}

export const subtitleSettings = new SubtitleSettingsStore();
