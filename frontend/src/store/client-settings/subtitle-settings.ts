import { watchImmediate } from '@vueuse/core';
import { watch } from 'vue';
import { remote } from '@/plugins/remote';
import { sealed } from '@/utils/validation';
import { SyncedStore } from '@/store/super/synced-store';
import { useFont } from '@/composables/use-font';

/**
 * == INTERFACES AND TYPES ==
 */

interface SubtitleApperance {
  fontFamily: string;
  fontSize: number;
  positionFromBottom: number;
  backdrop: boolean;
  stroke: boolean;
}

export interface SubtitleSettingsState {
  subtitleAppearance: SubtitleApperance;
}

@sealed
class SubtitleSettingsStore extends SyncedStore<SubtitleSettingsState> {
  private readonly _bodyFont = useFont();

  public set subtitleAppearance(newVal: SubtitleSettingsState['subtitleAppearance']) {
    this._state.subtitleAppearance = newVal;
  }

  public get subtitleAppearance(): SubtitleSettingsState['subtitleAppearance'] {
    return this._state.subtitleAppearance;
  }

  private readonly _updateSubtitleFontFamily = (): void => {
    this.subtitleAppearance.fontFamily
        = this.subtitleAppearance.fontFamily === 'auto'
        ? this._bodyFont.currentFont.value
        : this.subtitleAppearance.fontFamily;
  };

  public constructor() {
    super('subtitleSettings', {
      subtitleAppearance: {
        fontFamily: 'auto',
        fontSize: 1.5,
        positionFromBottom: 10,
        backdrop: true,
        stroke: false
      }
    }, 'localStorage');

    /**
     * == WATCHERS ==
     */

    /**
     * Font family changes
     */
    watchImmediate(this._bodyFont.currentFont, this._updateSubtitleFontFamily);

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

export default new SubtitleSettingsStore();
