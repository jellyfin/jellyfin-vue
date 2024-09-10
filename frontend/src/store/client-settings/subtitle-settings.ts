import { watch } from 'vue';
import { remote } from '@/plugins/remote';
import { sealed } from '@/utils/validation';
import { SyncedStore } from '@/store/super/synced-store';
import type { TypographyChoices } from '@/store';

/**
 * == INTERFACES AND TYPES ==
 */

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
   * @default: auto
   */
  fontFamily: 'auto' | TypographyChoices;
  fontSize: number;
  positionFromBottom: number;
  backdrop: boolean;
  stroke: boolean;
}

@sealed
class SubtitleSettingsStore extends SyncedStore<SubtitleSettingsState> {
  public state = this._state;

  public constructor() {
    super('subtitleSettings', {
      enabled: false,
      fontFamily: 'auto',
      fontSize: 1.5,
      positionFromBottom: 10,
      backdrop: true,
      stroke: false
    }, 'localStorage', [
      'enabled',
      'fontSize',
      'positionFromBottom',
      'backdrop',
      'stroke'
    ]);

    /**
     * == WATCHERS ==
     */
    watch(
      () => remote.auth.currentUser,
      () => {
        if (!remote.auth.currentUser) {
          this._reset();
        }
      }, { flush: 'post' }
    );
  }
}

export const subtitleSettings = new SubtitleSettingsStore();
