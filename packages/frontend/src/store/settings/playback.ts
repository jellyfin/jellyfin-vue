import { computed } from 'vue';
import { isBool, sealed } from '@jellyfin-vue/shared/validation';
import { SyncedStore } from '#/store/super/synced-store.ts';
import type { QualityMenuEntry, QualityMode, VideoInfo } from '#/utils/playback-capabilities/quality.ts';
import {
  DEFAULT_QUALITY_PREFERENCE,
  getPreferredQualityMode,
  parseQualityPreference
} from '#/utils/playback-capabilities/quality-preference.ts';
import type { VerdictEnvironment } from '#/utils/playback-capabilities/verdict.ts';

/**
 * == INTERFACES AND TYPES ==
 */

/**
 * What happens with HDR video on a display that is not HDR:
 * - `browser`: it is played as is and the browser adapts it
 * - `display`: it depends on the display; on an SDR display the server converts it (tone mapping), which transcodes
 * the video and needs tone mapping enabled on the server
 */
export type HdrMode = VerdictEnvironment['hdrMode'];

export interface PlaybackSettingsState {
  /**
   * The quality new playbacks start with: Automatic, Original or the height of a ladder level, which acts as a
   * cap. Only for this device, since it depends on the device and its network.
   * @default 'auto'
   */
  quality: QualityMenuEntry;
  /**
   * Whether to pick the version most compatible with this client when an item has several and none was chosen.
   * Synced with the server.
   * @default true
   */
  autoSelectVersion: boolean;
  /**
   * See {@link HdrMode}. Only for this device, since it depends on its display.
   * @default 'browser'
   */
  hdrMode: HdrMode;
  /**
   * Whether to show a notice when playback falls back to another method after a failure.
   * Synced with the server.
   * @default true
   */
  methodChangeNotices: boolean;
}

const DEFAULT_STATE: Readonly<PlaybackSettingsState> = Object.freeze({
  quality: DEFAULT_QUALITY_PREFERENCE,
  autoSelectVersion: true,
  hdrMode: 'browser',
  methodChangeNotices: true
});

/**
 * Whether a value is one of the HDR modes
 */
function isHdrMode(value: unknown): value is HdrMode {
  return value === 'browser' || value === 'display';
}

/**
 * Playback preferences. Each setting is exposed as a validated, writable computed: neither the local storage nor
 * the server's display preferences are validated when loaded, so a value that is not valid reads as the default
 * instead of reaching playback.
 */
@sealed
class PlaybackSettingsStore extends SyncedStore<PlaybackSettingsState> {
  /**
   * Creates the validated accessor of a boolean setting
   */
  private readonly _booleanSetting = (key: 'autoSelectVersion' | 'methodChangeNotices') => computed({
    get: (): boolean => {
      const value: unknown = this._state.value[key];

      return isBool(value) ? value : DEFAULT_STATE[key];
    },
    set: (value: boolean) => {
      this._state.value[key] = value;
    }
  });

  /**
   * See {@link PlaybackSettingsState.quality}. Use {@link getQualityMode} to know what it means for a media source.
   */
  public readonly quality = computed({
    get: () => parseQualityPreference(this._state.value.quality),
    set: (value: QualityMenuEntry) => {
      this._state.value.quality = parseQualityPreference(value);
    }
  });

  /**
   * See {@link PlaybackSettingsState.autoSelectVersion}
   */
  public readonly autoSelectVersion = this._booleanSetting('autoSelectVersion');

  /**
   * See {@link PlaybackSettingsState.hdrMode}
   */
  public readonly hdrMode = computed({
    get: (): HdrMode => {
      const value: unknown = this._state.value.hdrMode;

      return isHdrMode(value) ? value : DEFAULT_STATE.hdrMode;
    },
    set: (value: HdrMode) => {
      this._state.value.hdrMode = isHdrMode(value) ? value : DEFAULT_STATE.hdrMode;
    }
  });

  /**
   * See {@link PlaybackSettingsState.methodChangeNotices}
   */
  public readonly methodChangeNotices = this._booleanSetting('methodChangeNotices');

  /**
   * The quality mode a new playback of a media source starts with, from the preferred quality
   *
   * @param video - The video stream of the media source; undefined for music
   */
  public readonly getQualityMode = (video?: VideoInfo): QualityMode =>
    getPreferredQualityMode(this.quality.value, video);

  public constructor() {
    super({
      storeKey: 'playbackSettings',
      defaultState: () => ({ ...DEFAULT_STATE }),
      persistenceType: 'localStorage',
      resetOnLogout: true
    }, new Set<keyof PlaybackSettingsState>([
      'autoSelectVersion',
      'methodChangeNotices'
    ]));
  }
}

export const playbackSettings = new PlaybackSettingsStore();
