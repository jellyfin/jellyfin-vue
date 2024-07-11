/**
 * This store handles the state of the local player.
 *
 * In the other part, playbackManager is suited to handle the playback state in
 * an agnostic way, regardless of where the media is being played (remotely or locally)
 */
import JASSUB from 'jassub';
import jassubWorker from 'jassub/dist/jassub-worker.js?url';
import jassubWasmUrl from 'jassub/dist/jassub-worker.wasm?url';
import { PgsRenderer } from 'libpgs';
import pgssubWorker from 'libpgs/dist/libpgs.worker.js?url';
import { computed, nextTick, shallowRef, watch } from 'vue';
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
  isStretched: boolean;
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
  private _jassub: JASSUB | undefined;
  private _pgssub: PgsRenderer | undefined;
  protected _storeKey = 'playerElement';

  public readonly isStretched = computed({
    get: () => this._state.isStretched,
    set: (newVal: boolean) => {
      this._state.isStretched = newVal;
    }
  });

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

  private readonly _freeSsaTrack = (): void => {
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

  private readonly _setPgsTrack = (trackSrc: string): void => {
    if (
      !this._pgssub
      && mediaElementRef.value
      && mediaElementRef.value instanceof HTMLVideoElement
    ) {
      this._pgssub = new PgsRenderer({
        video: mediaElementRef.value,
        subUrl: trackSrc,
        workerUrl: pgssubWorker
      });
    } else if (this._pgssub) {
      this._pgssub.loadFromUrl(trackSrc);
    }
  };

  private readonly _freePgsTrack = (): void => {
    if (this._pgssub) {
      this._pgssub.dispose();
    }

    this._pgssub = undefined;
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
    const pgs = playbackManager.currentItemPgsParsedSubtitleTracks.find(
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

    this._freeSsaTrack();
    this._freePgsTrack();

    if (vttIdx !== -1 && mediaElementRef.value.textTracks[vttIdx]) {
      /**
       * If VTT found, applying it
       */
      mediaElementRef.value.textTracks[vttIdx].mode = 'showing';
    } else if (ass?.src) {
      /**
       * If SSA, using Subtitle Opctopus
       */
      this._setSsaTrack(ass.src, attachedFonts);
    } else if (pgs?.src) {
      /**
       * If PGS, using libpgs to render
       */
      this._setPgsTrack(pgs.src);
    }
  };

  public constructor() {
    super('playerElement', {
      isStretched: false
    });

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
        this._freeSsaTrack();
        this._freePgsTrack();
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
