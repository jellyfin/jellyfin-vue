import { watch } from 'vue';
import { remote } from '@/plugins/remote';
import { sealed } from '@/utils/validation';
import { SyncedStore } from '@/store/super/synced-store';

/**
 * == INTERFACES AND TYPES ==
 */

export interface SubtitleSettingsState {
  fontFamily: string;
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
      fontFamily: 'auto',
      fontSize: 1.5,
      positionFromBottom: 10,
      backdrop: true,
      stroke: false
    }, 'localStorage');

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
