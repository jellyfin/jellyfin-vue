/**
 * This store handles the state of the local player.
 *
 * In the other part, playbackManager is suited to handle the playback state in
 * an agnostic way, regardless of where the media is being played (remotely or locally)
 */
import JASSUB from 'jassub';
import jassubDefaultFont from 'jassub/dist/default.woff2?url';
import jassubWorker from 'jassub/dist/jassub-worker.js?url';
import jassubWasmUrl from 'jassub/dist/jassub-worker.wasm?url';
import { nextTick, reactive, watch } from 'vue';
import { playbackManager } from './playbackManager';
import { isArray, isNil } from '@/utils/validation';
import { mediaElementRef } from '@/store';
import { router } from '@/plugins/router';
import { remote } from '@/plugins/remote';

let jassub: JASSUB | undefined;
const fullscreenVideoRoute = '/playback/video';
const fullscreenMusicRoute = '/playback/music';

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
class PlayerElementStore {
  /**
   * == STATE SECTION ==
   */
  private readonly _defaultState: PlayerElementState = {
    isFullscreenMounted: false,
    isPiPMounted: false,
    isStretched: true
  };

  private readonly _state = reactive<PlayerElementState>(
    structuredClone(this._defaultState)
  );
  /**
   * == GETTERS AND SETTERS ==
   */
  public get isFullscreenMounted(): boolean {
    return this._state.isFullscreenMounted;
  }

  public set isFullscreenMounted(newIsMounted: boolean) {
    this._state.isFullscreenMounted = newIsMounted;
  }

  public get isPiPMounted(): boolean {
    return this._state.isPiPMounted;
  }

  public set isPiPMounted(newIsPipMounted: boolean) {
    this._state.isPiPMounted = newIsPipMounted;
  }

  public get isStretched(): boolean {
    return this._state.isStretched;
  }

  public set isStretched(newIsStretched: boolean) {
    this._state.isStretched = newIsStretched;
  }

  public get isFullscreenVideoPlayer(): boolean {
    return router.currentRoute.value.fullPath === fullscreenVideoRoute;
  }

  /**
   * == ACTIONS ==
   */
  public readonly toggleFullscreenVideoPlayer = async (): Promise<void> => {
    if (this.isFullscreenVideoPlayer) {
      router.back();
    } else {
      await router.push(fullscreenVideoRoute);
    }
  };

  private readonly _setSsaTrack = (trackSrc: string, attachedFonts?: string[]): void => {
    if (
      !jassub &&
      mediaElementRef.value &&
      mediaElementRef.value instanceof HTMLVideoElement
    ) {
      jassub = new JASSUB({
        video: mediaElementRef.value,
        subUrl: trackSrc,
        fonts: attachedFonts,
        workerUrl: jassubWorker,
        wasmUrl: jassubWasmUrl,
        availableFonts: { 'liberation sans': jassubDefaultFont },
        // Both parameters needed for subs to work on iOS
        prescaleFactor: 0.8,
        onDemandRender: false
      });
    } else if (jassub) {
      if (isArray(attachedFonts)) {
        for (const font of attachedFonts) {
          jassub.addFont(font);
        }
      }

      jassub.setTrackByUrl(trackSrc);
    }
  };

  public readonly freeSsaTrack = (): void => {
    if (jassub) {
      try {
        jassub.destroy();
      } catch {}

      jassub = undefined;
    }
  };

  private readonly _isSupportedFont = (mimeType: string | undefined | null): boolean => {
    return (
      !isNil(mimeType) &&
      mimeType.startsWith('font/') &&
      (mimeType.includes('ttf') ||
      mimeType.includes('otf') ||
      mimeType.includes('woff'))
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
      (sub) => sub.srcIndex === playbackManager.currentSubtitleStreamIndex
    );
    const ass = playbackManager.currentItemAssParsedSubtitleTracks.find(
      (sub) => sub.srcIndex === playbackManager.currentSubtitleStreamIndex
    );
    const attachedFonts =
      playbackManager.currentMediaSource?.MediaAttachments?.filter((a) =>
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

  private readonly _clear = (): void => {
    Object.assign(this._state, this._defaultState);
  };

  public constructor() {
    /**
     * * Move user to the fullscreen page when starting video playback by default
     * * Move user out of the fullscreen pages when playback is over
     */
    watch(
      () => playbackManager.currentItem,
      async (newValue, oldValue) => {
        const currentFullPath = router.currentRoute.value.fullPath;

        if (
          !newValue &&
          (currentFullPath.includes(fullscreenMusicRoute) ||
          currentFullPath.includes(fullscreenVideoRoute))
        ) {
          router.back();
        } else if (
          newValue &&
          !oldValue &&
          playbackManager.currentlyPlayingMediaType === 'Video'
        ) {
          await this.toggleFullscreenVideoPlayer();
        }
      }
    );

    watch(
      () => remote.auth.currentUser,
      () => {
        if (!remote.auth.currentUser) {
          this._clear();
        }
      }, { flush: 'post' }
    );
  }
}

export const playerElement = new PlayerElementStore();
