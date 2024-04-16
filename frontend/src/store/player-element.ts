/**
 * This store handles the state of the local player.
 *
 * In the other part, playbackManager is suited to handle the playback state in
 * an agnostic way, regardless of where the media is being played (remotely or locally)
 */
import JASSUB from 'jassub';
import jassubWorker from 'jassub/dist/jassub-worker.js?url';
import jassubWasmUrl from 'jassub/dist/jassub-worker.wasm?url';
import { computed, nextTick, watch } from 'vue';
import { playbackManager } from './playback-manager';
import { isArray, isNil, sealed } from '@/utils/validation';
import { mediaElementRef } from '@/store';
import { CommonStore } from '@/store/super/common-store';
import { router } from '@/plugins/router';
import { remote } from '@/plugins/remote';

/**
 * == INTERFACES AND TYPES ==
 */
interface PlayerElementState {
  isFullscreenMounted: boolean;
  isPiPMounted: boolean;
  isStretched: boolean;
}

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
  private _jassub: JASSUB | undefined;
  protected _storeKey = 'playerElement';
  /**
   * == GETTERS AND SETTERS ==
   */
  public readonly isFullscreenMounted = computed({
    get: () => this._state.isFullscreenMounted,
    set: (newVal: boolean) => {
      this._state.isFullscreenMounted = newVal;
    }
  });

  public readonly isPiPMounted = computed({
    get: () => this._state.isPiPMounted,
    set: (newVal: boolean) => {
      this._state.isPiPMounted = newVal;
    }
  });

  public readonly isStretched = computed({
    get: () => this._state.isStretched,
    set: (newVal: boolean) => {
      this._state.isStretched = newVal;
    }
  });

  public readonly isFullscreenVideoPlayer = computed(
    () => router.currentRoute.value.fullPath === this._fullscreenVideoRoute
  );

  /**
   * == ACTIONS ==
   */
  public readonly toggleFullscreenVideoPlayer = async (): Promise<void> => {
    if (this.isFullscreenVideoPlayer.value) {
      router.back();
    } else {
      await router.push(this._fullscreenVideoRoute);
    }
  };

  private readonly _setSsaTrack = (trackSrc: string, attachedFonts?: string[]): void => {
    if (
      !this._jassub
      && mediaElementRef.value
      && mediaElementRef.value instanceof HTMLVideoElement
    ) {
      this._jassub = new JASSUB({
        video: mediaElementRef.value,
        subUrl: trackSrc,
        fonts: attachedFonts,
        workerUrl: jassubWorker,
        wasmUrl: jassubWasmUrl,
        fallbackFont: 'InterVariable',
        // Both parameters needed for subs to work on iOS
        prescaleFactor: 0.8,
        onDemandRender: false,
        // OffscreenCanvas doesn't work perfectly on Workers: https://github.com/ThaUnknown/jassub/issues/33
        offscreenRender: false
      });
    } else if (this._jassub) {
      if (isArray(attachedFonts)) {
        for (const font of attachedFonts) {
          this._jassub.addFont(font);
        }
      }

      this._jassub.setTrackByUrl(trackSrc);
    }
  };

  public readonly freeSsaTrack = (): void => {
    if (this._jassub) {
      try {
        this._jassub.destroy();
      } catch {}

      this._jassub = undefined;
    }
  };

  private readonly _isSupportedFont = (mimeType: string | undefined | null): boolean => {
    return (
      !isNil(mimeType)
      && mimeType.startsWith('font/')
      && (mimeType.includes('ttf')
      || mimeType.includes('otf')
      || mimeType.includes('woff'))
    );
  };

  /**
   * Applies the current subtitle from the playbackManager store
   *
   * It first disables all the VTT and SSA subtitles
   * It then find the potential index of the applied VTT sub
   * Or the PlaybackExternalTrack object of the potential SSA sub
   *
   * If external and VTT, it shows the correct one
   * If external and SSA, it loads it in SO
   *
   * If embedded, a new transcode is automatically fetched from the playbackManager watchers.
   */
  public readonly applyCurrentSubtitle = async (): Promise<void> => {
    const serverAddress = remote.sdk.api?.basePath;
    /**
     * Finding (if it exists) the VTT or SSA track associated to the newly picked subtitle
     */
    const vttIdx = playbackManager.currentItemVttParsedSubtitleTracks.findIndex(
      sub => sub.srcIndex === playbackManager.currentSubtitleStreamIndex
    );
    const ass = playbackManager.currentItemAssParsedSubtitleTracks.find(
      sub => sub.srcIndex === playbackManager.currentSubtitleStreamIndex
    );
    const attachedFonts
      = playbackManager.currentMediaSource?.MediaAttachments?.filter(a =>
        this._isSupportedFont(a.MimeType)
      )
        .map((a) => {
          if (a.DeliveryUrl && serverAddress) {
            return `${serverAddress}${a.DeliveryUrl}`;
          }
        })
        .filter((a): a is string => a !== undefined) ?? [];

    if (!mediaElementRef.value) {
      return;
    }

    await nextTick();

    /**
     * Disabling VTT and SSA subs at first
     */
    for (const textTrack of mediaElementRef.value.textTracks) {
      if (textTrack.mode !== 'disabled') {
        textTrack.mode = 'disabled';
      }
    }

    playerElement.freeSsaTrack();

    if (vttIdx !== -1 && mediaElementRef.value.textTracks[vttIdx]) {
      /**
       * If VTT found, applying it
       */
      mediaElementRef.value.textTracks[vttIdx].mode = 'showing';
    } else if (ass?.src) {
      /**
       * If SSA, using Subtitle Opctopus
       */
      playerElement._setSsaTrack(ass.src, attachedFonts);
    }
  };

  public constructor() {
    super('playerElement', {
      isFullscreenMounted: false,
      isPiPMounted: false,
      isStretched: false
    });

    /**
     * * Move user to the fullscreen page when starting video playback by default
     * * Move user out of the fullscreen pages when playback is over
     */
    watch(
      () => playbackManager.currentItem,
      async (newValue, oldValue) => {
        if (
          newValue
          && !oldValue
          && playbackManager.currentlyPlayingMediaType === 'Video'
        ) {
          await this.toggleFullscreenVideoPlayer();
        }
      }
    );

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
