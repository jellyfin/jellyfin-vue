/**
 * This store handles the state of the local player.
 *
 * In the other part, playbackManager is suited to handle the playback state in
 * an agnostic way, regardless of where the media is being played (remotely or locally)
 */
import ASSSUB, { type IASSSUB } from 'assjs';
import { PgsRenderer } from 'libpgs';
import pgssubWorker from 'libpgs/dist/libpgs.worker.js?url';
import { computed, nextTick, shallowRef, watch } from 'vue';
import { SubtitleDeliveryMethod } from '@jellyfin/sdk/lib/generated-client/models/subtitle-delivery-method';
import { useFullscreen } from '@vueuse/core';
import { playbackManager, type PlaybackExternalTrack } from './playback-manager';
import { isNil, sealed } from '@/utils/validation';
import { mediaElementRef } from '@/store';
import { CommonStore } from '@/store/super/common-store';
import { router } from '@/plugins/router';
import { remote } from '@/plugins/remote';
import type { ParsedSubtitleTrack } from '@/plugins/workers/generic/subtitles';
import { genericWorker } from '@/plugins/workers';
import { subtitleSettings } from '@/store/client-settings/subtitle-settings';

/**
 * TODO: Provide option for the user to select if subtitles should be rendered by the browser or transcoded in server
 * That option must take into account if transcoding is enabled in server (and user has permission to use it as well)
 */

interface SubtitleExternalTrack extends PlaybackExternalTrack {
  parsed?: ParsedSubtitleTrack;
}

/**
 * == INTERFACES AND TYPES ==
 */
interface PlayerElementState {
  isStretched: boolean;
  currentExternalSubtitleTrack?: SubtitleExternalTrack;
}

export const videoContainerRef = shallowRef<HTMLDivElement>();

/**
 * == CLASS CONSTRUCTOR ==
 */
@sealed
class PlayerElementStore extends CommonStore<PlayerElementState> {
  /**
   * == NON REACTIVE STATE ==
   * Reactive state is defined in the super() constructor
   */
  private readonly _fullscreenVideoRoute = '/playback/video';
  private readonly _cleanups = new Set<() => void>();
  private _asssub: IASSSUB | undefined;
  private _pgssub: PgsRenderer | undefined;
  protected _storeKey = 'playerElement';

  public readonly isStretched = computed({
    get: () => this._state.isStretched,
    set: (newVal: boolean) => {
      this._state.isStretched = newVal;
    }
  });

  public get currentExternalSubtitleTrack(): PlayerElementState['currentExternalSubtitleTrack'] {
    return this._state.currentExternalSubtitleTrack;
  }

  private set currentExternalSubtitleTrack(newVal: PlayerElementState['currentExternalSubtitleTrack']) {
    this._state.currentExternalSubtitleTrack = newVal;
  }

  private get _usingExternalVttSubtitles(): boolean {
    return !isNil(this.currentExternalSubtitleTrack)
      && (
        this.currentExternalSubtitleTrack.codec === 'vtt'
        || this.currentExternalSubtitleTrack.codec === 'srt'
        || this.currentExternalSubtitleTrack.codec === 'subrip'
      );
  }

  private get _usingExternalSsaSubtitles(): boolean {
    return !isNil(this.currentExternalSubtitleTrack)
      && (
        this.currentExternalSubtitleTrack.codec === 'ssa'
        || this.currentExternalSubtitleTrack.codec === 'ass'
      );
  }

  private get _usingExternalPgsSubtitles(): boolean {
    return !isNil(this.currentExternalSubtitleTrack)
      && (
        this.currentExternalSubtitleTrack.codec === 'pgssub'
      );
  }

  /**
   * Logic for applying custom subtitle track.
   *
   * Returns false if subtitle delivery method isn't external
   * or if device is iOS/Android.
   */
  private get _useCustomSubtitleTrack(): boolean {
    return !isNil(playbackManager.currentSubtitleTrack)
      && subtitleSettings.state.enabled
      && playbackManager.currentSubtitleTrack.DeliveryMethod === SubtitleDeliveryMethod.External
      /**
       * If useFullscreen isn't supported we can assume the media player is Safari iOS
       * in this case we wouldn't apply a custom subtitle track, since it cannot
       * be rendered in Safari iOS's fullscreen element
       */
      && useFullscreen().isSupported.value;
  }

  /**
   * == ACTIONS ==
   */
  public readonly toggleFullscreenVideoPlayer = async (): Promise<void> => {
    if (router.currentRoute.value.fullPath === this._fullscreenVideoRoute) {
      router.back();
    } else {
      await router.push(this._fullscreenVideoRoute);
    }
  };

  private readonly _fetchSubtitleTrack = async (trackSrc: string) => {
    const axios = remote.sdk.api?.axiosInstance;

    return {
      [trackSrc]: (await axios!.get(trackSrc)).data as string
    };
  };

  private readonly _setSsaTrack = async (trackSrc: string): Promise<void> => {
    if (!mediaElementRef.value || !(mediaElementRef.value instanceof HTMLVideoElement)) {
      return;
    }

    this._clear();

    const subtitleTrackPayload = await this._fetchSubtitleTrack(trackSrc);

    if (this.currentExternalSubtitleTrack && subtitleTrackPayload[this.currentExternalSubtitleTrack.src]) {
      /**
       * video_width works better with ultrawide monitors
       */
      this._asssub = new ASSSUB(
        subtitleTrackPayload[this.currentExternalSubtitleTrack.src],
        mediaElementRef.value,
        { resampling: 'video_width' }
      );

      this._cleanups.add(() => {
        this._asssub?.destroy();
        this._asssub = undefined;
      });
    }
  };

  private readonly _applyPgsSubtitles = (): void => {
    const trackSrc = this.currentExternalSubtitleTrack?.src;

    if (trackSrc) {
      if (
        !this._pgssub
        && mediaElementRef.value instanceof HTMLVideoElement
        && this.currentExternalSubtitleTrack
      ) {
        this._pgssub = new PgsRenderer({
          video: mediaElementRef.value,
          subUrl: trackSrc,
          workerUrl: pgssubWorker
        });

        this._cleanups.add(() => {
          this._pgssub?.dispose();
          this._pgssub = undefined;
        });
      } else if (this._pgssub) {
        this._pgssub.loadFromUrl(trackSrc);
      }
    }
  };

  /**
   * Applies VTT (WebVTT) subtitles to the media element.
   */
  private readonly _applyVttSubtitles = async (): Promise<void> => {
    if (
      mediaElementRef.value
      && this.currentExternalSubtitleTrack
    ) {
      const subtitleTrack = this.currentExternalSubtitleTrack;

      /**
       * Check if client is able to display custom subtitle track
       * otherwise show default subtitle track
       */
      if (this._useCustomSubtitleTrack) {
        const data = await genericWorker.parseVttFile(subtitleTrack.src);

        this.currentExternalSubtitleTrack.parsed = data;
      } else {
        mediaElementRef.value.textTracks[subtitleTrack.srcIndex].mode = 'showing';
      }
    }
  };

  /**
   * Applies SSA (SubStation Alpha) subtitles to the media element.
   */
  private readonly _applySsaSubtitles = async (): Promise<void> => {
    if (!this.currentExternalSubtitleTrack || !mediaElementRef) {
      return;
    }

    const subtitleTrack = this.currentExternalSubtitleTrack;

    /**
     * Check if client is able to display custom subtitle track
     */
    if (this._useCustomSubtitleTrack) {
      const data = await genericWorker.parseSsaFile(subtitleTrack.src);

      /**
       * Check if worker returned that the sub data is 'basic', when true use basic renderer method
       */
      if (data?.isBasic) {
        this.currentExternalSubtitleTrack.parsed = data;

        return;
      }
    }

    this._setSsaTrack(subtitleTrack.src);
  };

  /**
   * Applies the current subtitle from the playbackManager store
   *
   * It first disables all the VTT and SSA subtitles
   * then filters the streams by codec and passes
   * to the function to apply that codec
   */
  public readonly applyCurrentSubtitle = async (): Promise<void> => {
    if (!mediaElementRef.value) {
      return;
    }

    /**
     * Clear VTT and SSA subs first
     */
    for (const textTrack of mediaElementRef.value.textTracks) {
      if (textTrack.mode !== 'disabled') {
        textTrack.mode = 'disabled';
      }
    }

    this._clear();
    this.currentExternalSubtitleTrack = undefined;

    await nextTick();

    // Search for selected external subtitle track
    this.currentExternalSubtitleTrack = playbackManager.currentItemExternalParsedSubtitleTracks.find(
      sub => sub.srcIndex === playbackManager.currentSubtitleStreamIndex
    );

    /**
     * If selected external track exists,
     * check which subtitle codec is being used and apply
     */
    if (this.currentExternalSubtitleTrack) {
      if (this._usingExternalPgsSubtitles) {
        this._applyPgsSubtitles();
      } else if (this._usingExternalVttSubtitles) {
        await this._applyVttSubtitles();
      } else if (this._usingExternalSsaSubtitles) {
        await this._applySsaSubtitles();
      }
    }
  };

  /**
   * Disposes all the subtitle resources
   */
  private readonly _clear = () => {
    for (const func of this._cleanups) {
      func();
    }

    this._cleanups.clear();
  };

  public constructor() {
    super('playerElement', () => ({
      isStretched: false,
      currentExternalSubtitleTrack: undefined
    }));

    /**
     * * Move user to the fullscreen page when starting video playback by default
     * * Move user out of the fullscreen pages when playback is over
     */
    watch(
      () => playbackManager.isVideo,
      async (newValue, oldValue) => {
        if (
          newValue
          && !oldValue
        ) {
          await this.toggleFullscreenVideoPlayer();
        }
      }
    );

    /**
     * We need to destroy JASSUB so the canvas can be recreated in the other view
     */
    watch(videoContainerRef, () => {
      if (!videoContainerRef.value) {
        this._clear();
      }
    }, { flush: 'sync' });

    watch([() => playbackManager.currentSubtitleStreamIndex, videoContainerRef], async (newVal) => {
      if (newVal[1]) {
        await this.applyCurrentSubtitle();
      }
    }, { flush: 'post' });

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

export const playerElement = new PlayerElementStore();
