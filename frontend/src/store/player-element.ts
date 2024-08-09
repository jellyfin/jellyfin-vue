/**
 * This store handles the state of the local player.
 *
 * In the other part, playbackManager is suited to handle the playback state in
 * an agnostic way, regardless of where the media is being played (remotely or locally)
 */
import JASSUB from 'jassub';
import jassubWorker from 'jassub/dist/jassub-worker.js?url';
import jassubWasmUrl from 'jassub/dist/jassub-worker.wasm?url';
import { computed, nextTick, shallowRef, watch } from 'vue';
import { SubtitleDeliveryMethod } from '@jellyfin/sdk/lib/generated-client/models/subtitle-delivery-method';
import { useFullscreen } from '@vueuse/core';
import { playbackManager, type PlaybackExternalTrack } from './playback-manager';
import { isArray, isNil, sealed } from '@/utils/validation';
import { mediaElementRef } from '@/store';
import { CommonStore } from '@/store/super/common-store';
import { router } from '@/plugins/router';
import { remote } from '@/plugins/remote';
import { parseSsaFile, parseVttFile, type ParsedSubtitleTrack } from '@/utils/subtitles';

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

  private get usingExternalVttSubtitles(): boolean {
    return !isNil(playbackManager.currentSubtitleTrack)
      && playbackManager.currentSubtitleTrack.DeliveryMethod === SubtitleDeliveryMethod.External
      && playbackManager.currentSubtitleTrack.Codec !== 'ass'
      && playbackManager.currentSubtitleTrack.Codec !== 'ssa';
  }

  private get usingExternalSsaSubtitles(): boolean {
    return !isNil(playbackManager.currentSubtitleTrack)
      && playbackManager.currentSubtitleTrack.DeliveryMethod === SubtitleDeliveryMethod.External
      && (playbackManager.currentSubtitleTrack.Codec === 'ssa' || playbackManager.currentSubtitleTrack.Codec === 'ass');
  }

  /**
   * Logic for applying custom subtitle track.
   *
   * Returns false if subtitle devliery method isn't external
   * or using iOS Safari
   */
  private get useCustomSubtitleTrack(): boolean {
    return !isNil(playbackManager.currentSubtitleTrack)
      && playbackManager.currentSubtitleTrack.DeliveryMethod === SubtitleDeliveryMethod.External
      /**
       * If useFullscreen isn't supported we can assume the media player is Safari iOS
       * in this case we wouldn't apply a custom subtitle track, since it cannot
       * be rendered in Safari iOS's fullscreen element
       */
      && useFullscreen().isSupported.value;
  }

  /**
   * Applies VTT (WebVTT) subtitles to the media element.
   *
   * This function searches for the VTT track associated with the
   * currently selected subtitle.
   */
  private readonly _applyVttSubtitles = async (): Promise<void> => {
    if (!mediaElementRef.value) {
      return;
    }

    /**
     * Finding (if it exists) the SSA track associated to the newly picked subtitle
     */
    const vtt = playbackManager.currentItemVttParsedSubtitleTracks.find(
      sub => sub.srcIndex === playbackManager.currentSubtitleStreamIndex
    );

    /**
     * If VTT found, applying it
     */
    if (vtt?.src && vtt.srcIndex !== -1) {
      this.currentExternalSubtitleTrack = vtt;

      /**
       * Check if client is able to display custom subtitle track
       * otherwise show default subtitle track
       */
      if (this.useCustomSubtitleTrack) {
        const data = await parseVttFile(vtt.src);
        this.currentExternalSubtitleTrack.parsed = data;
      } else {
        mediaElementRef.value.textTracks[vtt.srcIndex].mode = 'showing';
      }
    }
  };

  /**
   * Applies SSA (SubStation Alpha) subtitles to the media element.
   *
   * This function searches for the SSA track associated with the
   * currently selected subtitle.
   */
  private readonly _applySsaSubtitles = async (): Promise<void> => {
    if (!mediaElementRef.value) {
      return;
    }
    const serverAddress = remote.sdk.api?.basePath;

    /**
     * Finding (if it exists) the ssa track associated to the newly picked subtitle
     */
    const ssa = playbackManager.currentItemAssParsedSubtitleTracks.find(
      sub => sub.srcIndex === playbackManager.currentSubtitleStreamIndex
    );

    /**
     * If SSA found, applying it
     */
    if (ssa?.src) {
      this.currentExternalSubtitleTrack = ssa;

      /**
       * Check if client is able to display custom subtitle track
       * otherwise use Subtitle Opctopus
       */
      let applySubtitleOctopus = !this.useCustomSubtitleTrack;

      if (this.useCustomSubtitleTrack) {
        const data = await parseSsaFile(ssa.src);

        /**
         * If style isn't basic (animations, custom typographics, etc.)
         * fallback to rendering subtitles with Subtitle Ocotopus
         */
        if (data?.isBasic) {
          this.currentExternalSubtitleTrack.parsed = data;
        } else {
          applySubtitleOctopus = true;
        }
      }

      if (applySubtitleOctopus) {
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

        this._setSsaTrack(ssa.src, attachedFonts);
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
    this.currentExternalSubtitleTrack = undefined;

    await nextTick();

    /**
     * Check which subtitle codec is being used and apply
     */
    if (this.usingExternalVttSubtitles) {
      void this._applyVttSubtitles();
    } else if (this.usingExternalSsaSubtitles) {
      void this._applySsaSubtitles();
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
