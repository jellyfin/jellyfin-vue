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
import { SubtitleDeliveryMethod } from '@jellyfin/sdk/lib/generated-client/models/subtitle-delivery-method';
import { useFullscreen } from '@vueuse/core';
import { playbackManager, type PlaybackExternalTrack } from './playback-manager';
import { isArray, isNil, sealed } from '@/utils/validation';
import { DEFAULT_TYPOGRAPHY, mediaElementRef } from '@/store';
import { CommonStore } from '@/store/super/common-store';
import { router } from '@/plugins/router';
import { remote } from '@/plugins/remote';
import type { ParsedSubtitleTrack } from '@/plugins/workers/generic/subtitles';
import { genericWorker } from '@/plugins/workers';
import { subtitleSettings } from '@/store/client-settings/subtitle-settings';

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
  private _jassub: JASSUB | undefined;
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

  private readonly _setSsaTrack = (trackSrc: string, attachedFonts?: string[]): void => {
    if (
      !this._jassub
      && mediaElementRef.value
      && mediaElementRef.value instanceof HTMLVideoElement
    ) {
      const hasAttachedFonts = !isNil(attachedFonts) && attachedFonts.length !== 0;

      this._jassub = new JASSUB({
        video: mediaElementRef.value,
        subUrl: trackSrc,
        ...(hasAttachedFonts
          ? {
              fonts: attachedFonts
            }
          : {
              useLocalFonts: true
            }),
        fallbackFont: DEFAULT_TYPOGRAPHY,
        workerUrl: jassubWorker,
        wasmUrl: jassubWasmUrl,
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
   * Applies PGS subtitles to the media element.
   */
  private readonly _applyPgsSubtitles = (): void => {
    if (
      mediaElementRef.value
      && this.currentExternalSubtitleTrack
    ) {
      const subtitleTrack = this.currentExternalSubtitleTrack;

      this._setPgsTrack(subtitleTrack.src);
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
    if (
      mediaElementRef.value
      && this.currentExternalSubtitleTrack
    ) {
      const subtitleTrack = this.currentExternalSubtitleTrack;

      /**
       * Check if client is able to display custom subtitle track
       * otherwise use JASSUB to render subtitles
       */
      let applyJASSUB = !this._useCustomSubtitleTrack;

      if (this._useCustomSubtitleTrack) {
        const data = await genericWorker.parseSsaFile(subtitleTrack.src);

        /**
         * If style isn't basic (animations, custom typographics, etc.)
         * fallback to rendering subtitles with JASSUB
         */
        if (data?.isBasic) {
          this.currentExternalSubtitleTrack.parsed = data;
        } else {
          applyJASSUB = true;
        }
      }

      if (applyJASSUB) {
        const serverAddress = remote.sdk.api?.basePath;

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

        this._setSsaTrack(subtitleTrack.src, attachedFonts);
      }
    }
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

    this._freeSsaTrack();
    this._freePgsTrack();
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

  public constructor() {
    super('playerElement', {
      isStretched: false,
      currentExternalSubtitleTrack: undefined
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
