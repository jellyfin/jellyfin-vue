/**
 * This store handles the state of the local player.
 *
 * In the other part, playbackManager is suited to handle the playback state in
 * an agnostic way, regardless of where the media is being played (remotely or locally)
 */
import ASSSUB from 'assjs';
import { PgsRenderer } from 'libpgs';
import pgssubWorker from 'libpgs/dist/libpgs.worker.js?url';
import { computed, nextTick, shallowRef, watch } from 'vue';
import { SubtitleDeliveryMethod } from '@jellyfin/sdk/lib/generated-client/models/subtitle-delivery-method';
import { computedAsync, useFullscreen } from '@vueuse/core';
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client';
import { isNil, sealed } from '@jellyfin-vue/shared/validation';
import { playbackManager } from './playback-manager.ts';
import { mediaElementRef } from '#/store/index.ts';
import { CommonStore } from '#/store/super/common-store.ts';
import { router } from '#/plugins/router/index.ts';
import { remote } from '#/plugins/remote/index.ts';
import type { ParsedSubtitleTrack } from '#/plugins/workers/generic/subtitles.ts';
import { runGenericWorkerFunc } from '#/plugins/workers/index.ts';
import { subtitleSettings } from '#/store/settings/subtitle.ts';

/**
 * == INTERFACES AND TYPES ==
 */
/**
 * TODO: Provide option for the user to select if subtitles should be rendered by the browser or transcoded in server
 * That option must take into account if transcoding is enabled in server (and user has permission to use it as well)
 */
interface PlayerElementState {
  isStretched: boolean;
}
interface PlaybackTrack {
  label: string;
  src?: string;
  srcLang?: string;
  /**
   * Absolute `MediaStream.Index` of the stream, the same numbering used by the playback manager.
   * `-1` is used for the "no subtitles" entry of the menus.
   */
  index: number;
  type: SubtitleDeliveryMethod;
  codec?: string;
  /**
   * Format the server delivers the subtitle in (like `vtt`, `ass` or `pgssub`), which is what
   * decides how it's rendered. It can differ from the codec of the stream: for example, the
   * server converts SubRip and other text subtitles to WebVTT.
   */
  format?: string;
}

export interface PlaybackExternalTrack extends PlaybackTrack {
  src: string;
  codec: string;
}

/**
 * Gets the format of a subtitle delivered externally. The server builds the delivery URL
 * as `.../Stream.<format>`, so it's taken from its extension, falling back to the codec.
 */
function getSubtitleDeliveryFormat(deliveryUrl: string, codec?: string): string | undefined {
  const fileName = new URL(deliveryUrl, location.href).pathname.split('/').at(-1) ?? '';
  const extension = fileName.includes('.') ? fileName.split('.').at(-1) : undefined;

  return extension?.toLowerCase() ?? codec;
}

/**
 * Whether the subtitle is delivered as WebVTT (rendered natively or by the custom overlay)
 */
function isVtt(track: PlaybackTrack): boolean {
  return track.format === 'vtt';
}

/**
 * Whether the subtitle is delivered as SubStation Alpha (rendered by assjs)
 */
function isAss(track: PlaybackTrack): boolean {
  return track.format === 'ass' || track.format === 'ssa';
}

/**
 * Whether the subtitle is delivered as PGS (rendered by libpgs)
 */
function isPgs(track: PlaybackTrack): boolean {
  return track.format === 'pgssub';
}

export const videoContainerRef = shallowRef<HTMLDivElement>();

/**
 * == CLASS CONSTRUCTOR ==
 */
@sealed
class PlayerElementStore extends CommonStore<PlayerElementState, 'isStretched'> {
  /**
   * == NON REACTIVE STATE ==
   * Reactive state is defined in the super() constructor
   */
  private readonly _fullscreenVideoRoute = '/playback/video';
  private readonly _cleanups = new Set<() => void>();
  private _asssub: ASSSUB | undefined;
  private _pgssub: PgsRenderer | undefined;
  /**
   * If the Fullscreen API isn't supported, the media element can only go fullscreen through
   * the browser's own UI (like Safari iOS), where a custom subtitle overlay can't be rendered.
   *
   * Created once: calling useFullscreen inside a computed would register new listeners on every evaluation.
   */
  private readonly _isFullscreenSupported = useFullscreen().isSupported;

  /**
   * The current subtitle stream, as negotiated with the server for this device: unlike the
   * streams of the /Items DTO, it has the delivery data (`DeliveryMethod` and `DeliveryUrl`).
   */
  private readonly _currentNegotiatedSubtitleStream = computed(() =>
    playbackManager.currentNegotiatedMediaSource.value?.MediaStreams?.find(
      stream =>
        stream.Type === MediaStreamType.Subtitle
        && stream.Index === playbackManager.currentSubtitleTrack.value?.Index
    )
  );

  /**
   * Logic for applying custom subtitle track.
   *
   * Returns false if subtitle delivery method isn't external
   * or if the custom overlay can't be displayed in fullscreen.
   */
  private readonly _useCustomSubtitleTrack = computed(() =>
    subtitleSettings.state.value.enabled
    && this._currentNegotiatedSubtitleStream.value?.DeliveryMethod === SubtitleDeliveryMethod.External
    && this._isFullscreenSupported.value
  );

  /**
   * Subtitle tracks that can be displayed, with their delivery data taken from the
   * media source negotiated with the server.
   */
  public readonly currentItemParsedSubtitleTracks = computed(() =>
  /**
   * TODO: There is currently a bug in Jellyfin server when adding external subtitles
   * may play the incorrect subtitle
   * https://github.com/jellyfin/jellyfin/issues/13198
   */
    playbackManager.currentNegotiatedMediaSource.value?.MediaStreams?.filter(
      sub =>
        sub.Type === MediaStreamType.Subtitle
        && (sub.DeliveryMethod === SubtitleDeliveryMethod.Encode
          || sub.DeliveryMethod === SubtitleDeliveryMethod.External)
    )
      .map((sub) => {
        const codec = sub.Codec?.toLowerCase();
        const deliveryUrl = sub.DeliveryMethod === SubtitleDeliveryMethod.External
          ? sub.DeliveryUrl ?? undefined
          : undefined;

        return {
          label: sub.DisplayTitle ?? 'Undefined',
          src: remote.sdk.api?.basePath && deliveryUrl
            ? `${remote.sdk.api.basePath}${deliveryUrl}`
            : undefined,
          srcLang: sub.Language ?? undefined,
          type: sub.DeliveryMethod ?? SubtitleDeliveryMethod.Drop,
          index: sub.Index ?? -1,
          codec,
          format: deliveryUrl ? getSubtitleDeliveryFormat(deliveryUrl, codec) : undefined
        };
      })
  );

  /**
   * Filters the external subtitle tracks
   */
  public readonly currentItemExternalParsedSubtitleTracks = computed(() =>
    this.currentItemParsedSubtitleTracks.value?.filter(
      (sub): sub is typeof sub & PlaybackExternalTrack => !isNil(sub.codec) && !isNil(sub.src)
    )
  );

  /**
   * The selected subtitle track, if it's delivered externally (so it's rendered by the client)
   */
  public readonly currentExternalSubtitleTrack = computed(() =>
    this.currentItemExternalParsedSubtitleTracks.value?.find(
      sub => sub.index === playbackManager.currentSubtitleTrack.value?.Index
    )
  );

  /**
   * Parsed cues of the selected subtitle track, for the custom overlay. Only WebVTT is parsed:
   * ASS and PGS tracks have their own renderers.
   */
  private readonly _parsedSubtitleTrack = computedAsync(async () => {
    const track = this.currentExternalSubtitleTrack.value;

    if (track && isVtt(track) && this._useCustomSubtitleTrack.value) {
      return {
        src: track.src,
        parsed: await runGenericWorkerFunc('parseVttFile')(track.src)
      };
    }
  });

  /**
   * Cues to display in the custom subtitle overlay, only while they belong
   * to the selected track (they're parsed asynchronously)
   */
  public readonly currentParsedSubtitleTrack = computed<ParsedSubtitleTrack | undefined>(() =>
    this._useCustomSubtitleTrack.value
    && this._parsedSubtitleTrack.value?.src === this.currentExternalSubtitleTrack.value?.src
      ? this._parsedSubtitleTrack.value?.parsed
      : undefined
  );

  public readonly currentItemVttParsedSubtitleTracks = computed(() =>
    this.currentItemExternalParsedSubtitleTracks.value?.filter(sub => isVtt(sub))
  );

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

  /**
   * Applies SSA (SubStation Alpha) subtitles to the media element.
   */
  private readonly _applySsaSubtitles = async (): Promise<void> => {
    if (!(mediaElementRef.value
      && this.currentExternalSubtitleTrack.value
      && (mediaElementRef.value instanceof HTMLVideoElement))) {
      return;
    }

    this._clear();

    const trackSrc = this.currentExternalSubtitleTrack.value.src;
    const subtitleTrackPayload = await this._fetchSubtitleTrack(trackSrc);

    if (subtitleTrackPayload[trackSrc]) {
      /**
       * video_width works better with ultrawide monitors
       */
      this._asssub = new ASSSUB(
        subtitleTrackPayload[trackSrc],
        mediaElementRef.value,
        { resampling: 'video_width' }
      );

      /**
       * assjs only starts rendering on the element's `play`/`playing` events, and has no method to
       * start it otherwise. The renderer is usually created while the media is already playing
       * (the subtitle file is fetched asynchronously, or the track is chosen during playback), so it
       * would stay empty until the next pause and resume: replay the event for it.
       */
      if (!mediaElementRef.value.paused) {
        mediaElementRef.value.dispatchEvent(new Event('playing'));
      }

      this._cleanups.add(() => {
        this._asssub?.destroy();
        this._asssub = undefined;
      });
    }
  };

  private readonly _applyPgsSubtitles = (): void => {
    const trackSrc = this.currentExternalSubtitleTrack.value?.src;

    if (trackSrc) {
      if (
        !this._pgssub
        && mediaElementRef.value instanceof HTMLVideoElement
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
  private readonly _applyVttSubtitles = () => {
    if (!(mediaElementRef.value
      && this.currentExternalSubtitleTrack.value)) {
      return;
    }

    const subtitleTrack = this.currentExternalSubtitleTrack.value;

    /**
     * Check if client is able to display custom subtitle track
     * otherwise show default subtitle track
     */
    if (!this._useCustomSubtitleTrack.value) {
      /**
       * Only the VTT tracks are rendered as <track> elements and the browser can add its own
       * in-band text tracks, so positions in `textTracks` don't match the ones of our subtitle list.
       * Use the TextTrack of the <track> element rendered for this subtitle instead.
       */
      const trackElement = [...mediaElementRef.value.querySelectorAll('track')].find(
        el => el.dataset.streamIndex === String(subtitleTrack.index)
      );

      if (trackElement) {
        trackElement.track.mode = 'showing';
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

    this._clear();

    await nextTick();

    /**
     * If selected external track exists,
     * check the format it's delivered in and apply
     */
    const track = this.currentExternalSubtitleTrack.value;

    if (track) {
      if (isPgs(track)) {
        this._applyPgsSubtitles();
      } else if (isVtt(track)) {
        this._applyVttSubtitles();
      } else if (isAss(track)) {
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
    super({
      storeKey: 'playerElement',
      defaultState: () => ({
        isStretched: false
      }),
      resetOnLogout: true
    });

    /**
     * * Move user to the fullscreen page when starting video playback by default
     * * Move user out of the fullscreen pages when playback is over
     */
    watch(playbackManager.isVideo,
      async () => {
        await this.toggleFullscreenVideoPlayer();
      }
    );

    /**
     * We need to destroy the subtitle renderers (assjs and libpgs) so their canvas
     * can be recreated in the other view
     */
    watch(videoContainerRef, () => {
      if (!videoContainerRef.value) {
        this._clear();
      }
    }, { flush: 'sync' });

    /**
     * Watches the identity of the track (not the stream objects, which are replaced whenever
     * the item data is refreshed) and the way it must be rendered
     */
    watch([
      () => playbackManager.currentSubtitleTrack.value?.Index,
      () => this.currentExternalSubtitleTrack.value?.src,
      this._useCustomSubtitleTrack,
      videoContainerRef
    ], async (newVal) => {
      if (newVal[3]) {
        await this.applyCurrentSubtitle();
      }
    }, { flush: 'post' });
  }
}

export const playerElement = new PlayerElementStore();
