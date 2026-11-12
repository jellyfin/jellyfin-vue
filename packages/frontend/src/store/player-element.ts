/**
 * This store handles the state of the local player.
 *
 * In the other part, playbackManager is suited to handle the playback state in
 * an agnostic way, regardless of where the media is being played (remotely or locally)
 */
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
import { recordAudioTrackSwitchingFailure } from '#/store/playback-capabilities.ts';
import { NATIVE_SUBTITLE_FORMATS } from '#/utils/playback-capabilities/subtitles.ts';
import { getSubtitleRenderer } from '#/utils/subtitle-renderers.ts';

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
 * Whether the subtitle is delivered as WebVTT (rendered natively or by the custom overlay).
 * Any other delivered format is drawn by the subtitle renderer that declares it.
 */
function isVtt(track: PlaybackTrack): boolean {
  return track.format !== undefined && NATIVE_SUBTITLE_FORMATS.includes(track.format);
}

/**
 * Everything the subtitles on screen depend on: applying them again for the same target would only draw the same
 * thing again (and fetch the subtitle file again)
 */
interface SubtitleTarget {
  element: HTMLMediaElement;
  container: HTMLDivElement;
  /**
   * The selected subtitle, how it's drawn and, for native tracks, the media source URL: the `<track>`
   * elements are re-created for every new source, while the renderers keep drawing over the same element
   */
  key: string;
  /**
   * Whether the subtitle is drawn by a renderer over a video whose size isn't known yet (no metadata)
   */
  awaitsVideoSize: boolean;
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
  /**
   * Incremented whenever the subtitle resources are disposed, so a renderer that finishes starting after that
   * is stopped instead of being left drawing
   */
  private _subtitleGeneration = 0;
  /**
   * What the subtitles were last applied for (see `_getSubtitleTarget`), until they're disposed
   */
  private _appliedSubtitle: SubtitleTarget | undefined;
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

  /**
   * Makes the media element play the selected audio track of a file it plays directly. Only possible when the
   * element exposes `audioTracks` and the list matches the file's audio streams one to one, in order: if it
   * doesn't, the element can't be trusted to switch tracks, which is recorded so a secondary track is remuxed
   * from now on (re-negotiating the current playback if it needs it).
   *
   * Remuxes and transcodes carry only the selected audio track, so there's nothing to switch there.
   *
   * @param el - The media element, once it has loaded the file's metadata
   */
  public readonly applyAudioTrack = (el: HTMLMediaElement): void => {
    // `audioTracks` isn't in TypeScript's DOM library
    const { audioTracks } = el as HTMLMediaElement & { audioTracks?: Iterable<{ enabled: boolean }> & { length: number } };
    const negotiated = playbackManager.currentNegotiatedMediaSource.value;
    const selected = playbackManager.currentAudioTrack.value?.Index;

    if (!audioTracks || !negotiated || isNil(selected) || playbackManager.currentPlaybackMethod.value !== 'DirectPlay') {
      return;
    }

    const fileAudio = negotiated.MediaStreams?.filter(
      stream => stream.Type === MediaStreamType.Audio && !stream.IsExternal
    ) ?? [];
    const position = fileAudio.findIndex(stream => stream.Index === selected);

    if (position !== -1 && audioTracks.length === fileAudio.length) {
      for (const [index, track] of [...audioTracks].entries()) {
        track.enabled = index === position;
      }
    } else if (position > 0) {
      recordAudioTrackSwitchingFailure();
    }
  };

  /**
   * Draws the subtitle with the renderer of the registry that declares its delivered format
   */
  private readonly _applyRendererSubtitles = async (track: PlaybackExternalTrack): Promise<void> => {
    const renderer = getSubtitleRenderer(track.format);
    const video = mediaElementRef.value;

    if (!renderer || !(video instanceof HTMLVideoElement)) {
      return;
    }

    const generation = this._subtitleGeneration;
    const stop = await renderer.render(video, track.src);

    if (generation === this._subtitleGeneration) {
      this._cleanups.add(stop);
    } else {
      stop();
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
   * What the current subtitle would be applied for. Undefined while there's no video container: the
   * subtitles are drawn over the media element inside it, and they're applied once it's mounted.
   */
  private readonly _getSubtitleTarget = (): SubtitleTarget | undefined => {
    const element = mediaElementRef.value;
    const container = videoContainerRef.value;

    if (!element || !container) {
      return;
    }

    const track = this.currentExternalSubtitleTrack.value;
    const native = track !== undefined && isVtt(track);

    return {
      element,
      container,
      key: JSON.stringify([
        track?.index,
        track?.src,
        this._useCustomSubtitleTrack.value,
        native ? playbackManager.currentSourceUrl.value : undefined
      ]),
      awaitsVideoSize: track !== undefined && !native && element instanceof HTMLVideoElement && element.videoWidth === 0
    };
  };

  /**
   * Applies the current subtitle from the playbackManager store
   *
   * It first disables every text track and stops the subtitle renderers, then shows the selected
   * subtitle by the format it's delivered in: WebVTT natively (or in the custom overlay), anything
   * else with the subtitle renderer that declares the format.
   *
   * It does nothing if the subtitles are already applied for the same target, so it can be called
   * whenever something they depend on may have changed.
   */
  public readonly applyCurrentSubtitle = async (): Promise<void> => {
    const target = this._getSubtitleTarget();
    const applied = this._appliedSubtitle;

    if (
      !target
      || (applied?.element === target.element && applied.container === target.container && applied.key === target.key)
    ) {
      return;
    }

    /**
     * Clear VTT and SSA subs first
     */
    for (const textTrack of target.element.textTracks) {
      if (textTrack.mode !== 'disabled') {
        textTrack.mode = 'disabled';
      }
    }

    this._clear();

    /**
     * A renderer lays the subtitles out for the size of the video when it's created (assjs takes its layout
     * resolution from `videoWidth`/`videoHeight`, or from the element's box before the metadata, and then stretches
     * the subtitles to the video's aspect): it's created once the size is known. The media element's `loadeddata`
     * applies the subtitles again (see `PlayerElement.vue`).
     */
    if (target.awaitsVideoSize) {
      return;
    }

    this._appliedSubtitle = target;

    await nextTick();

    /**
     * If selected external track exists,
     * check the format it's delivered in and apply
     */
    const track = this.currentExternalSubtitleTrack.value;

    if (track && isVtt(track)) {
      this._applyVttSubtitles();
    } else if (track) {
      await this._applyRendererSubtitles(track);
    }
  };

  /**
   * Disposes all the subtitle resources
   */
  private readonly _clear = () => {
    this._subtitleGeneration++;
    this._appliedSubtitle = undefined;

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
     * Choosing another audio track while the file plays directly keeps its URL, so the element
     * isn't reloaded (and doesn't load the metadata again): switch the track on it
     */
    watch([
      () => playbackManager.currentAudioTrack.value?.Index,
      playbackManager.currentPlaybackMethod
    ], () => {
      const el = mediaElementRef.value;

      if (el && el.readyState >= HTMLMediaElement.HAVE_METADATA) {
        this.applyAudioTrack(el);
      }
    }, { flush: 'post' });

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
     * the item data is refreshed) and the way it must be rendered.
     *
     * The container is watched through a getter: a shallow ref among the sources would make Vue run
     * the callback whenever any source is re-evaluated, even with the same values (for example, when
     * the item data is refreshed after the playback start is reported).
     */
    watch([
      () => playbackManager.currentSubtitleTrack.value?.Index,
      () => this.currentExternalSubtitleTrack.value?.src,
      this._useCustomSubtitleTrack,
      () => videoContainerRef.value
    ], this.applyCurrentSubtitle, { flush: 'post' });
  }
}

export const playerElement = new PlayerElementStore();
