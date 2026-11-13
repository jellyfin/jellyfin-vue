/**
 * This store handles the state of the playback
 *
 * It must be used in an agnostic way to cover both local and remote playback.
 * If you want to handle the state of the local player element, use playerElement store instead.
 */
import {
  BaseItemKind,
  ItemFilter,
  ItemSortBy,
  MediaStreamType,
  PlayMethod,
  type BaseItemDto,
  type MediaSourceInfo,
  type PlaybackInfoResponse
} from '@jellyfin/sdk/lib/generated-client';
import { getInstantMixApi } from '@jellyfin/sdk/lib/utils/api/instant-mix-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api';
import { computedAsync, watchThrottled } from '@vueuse/core';
import { computed, shallowRef, watch, watchEffect } from 'vue';
import { isNil, sealed } from '@jellyfin-vue/shared/validation';
import i18next from 'i18next';
import { useBaseItem } from '#/composables/apis.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { remote } from '#/plugins/remote/index.ts';
import { apiStore } from '#/store/dbs/api/index.ts';
import {
  getMediaSourceVerdict,
  getPlaybackPolicy,
  getLearnedFloor,
  recordMediaSourceFailure,
  recordPlaybackOutcome,
  renegotiatingEnvironment
} from '#/store/playback-capabilities.ts';
import { prefetchMediaSourceVerdicts, resolveMediaSourceIndex } from '#/store/playback-versions.ts';
import {
  autoQualityRevision,
  getCurrentAutoState,
  getPlaybackQualityMode,
  playbackObservations,
  restoreAutoState,
  type PlaybackChangeReason
} from '#/store/playback-quality.ts';
import { playbackSettings } from '#/store/settings/playback.ts';
import { getImageInfo } from '#/utils/images.ts';
import { getNoOtherMethodText, getPlayingMethodName } from '#/utils/playback-labels.ts';
import { getItemRuntime, getStaticStreamUrl } from '#/utils/items.ts';
import { findQueueItem, getQueueRemoval } from '#/utils/playback-queue.ts';
import { PREFETCH_BUFFER_AHEAD_S } from '#/utils/playback-capabilities/constants.ts';
import { buildPlaybackRequest, deriveActualMethod } from '#/utils/playback-capabilities/device-profile.ts';
import { getFailureStep, type FailureStep } from '#/utils/playback-capabilities/failure-ladder.ts';
import { getDecodedVideo, getModeLevel, getRunningEntry, getVideoStream, type QualityMode } from '#/utils/playback-capabilities/quality.ts';
import type { AutoState } from '#/utils/playback-capabilities/quality-auto.ts';
import {
  keepsCurrentPlayback,
  type RenegotiationIntent,
  type RenegotiationOutcome
} from '#/utils/playback-capabilities/renegotiation.ts';
import { getBufferedAhead } from '#/utils/playback-capabilities/runtime-signals.ts';
import {
  isMoreExpensive,
  type PlaybackMethod,
  type Verdict
} from '#/utils/playback-capabilities/verdict.ts';
import { SUBTITLE_RENDERERS } from '#/utils/subtitle-renderers.ts';
import { msToTicks } from '#/utils/time.ts';
import { mediaControls, mediaElementRef } from '#/store/index.ts';
import { CommonStore } from '#/store/super/common-store.ts';
import { runGenericWorkerFunc } from '#/plugins/workers/index.ts';

/**
 * == INTERFACES AND TYPES ==
 */

export enum PlaybackStatus {
  Stopped = 0,
  Playing = 1,
  Paused = 2,
  Buffering = 3,
  Error = 4
}

export enum RepeatMode {
  RepeatNone = 0,
  RepeatOne = 1,
  RepeatAll = 2
}

export enum InitMode {
  Unknown = 0,
  Shuffle = 1,
  Item = 2,
  ShuffleItem = 3
}

interface PlaybackManagerState {
  status: PlaybackStatus;
  currentItemIndex?: number;
  /**
   * Version (index in `MediaSources`) and tracks explicitly chosen by the user for the item
   * `itemId`. They only apply while that item is the current one: they're not carried over
   * to the rest of the queue, whose items have their own versions and streams.
   * Track indexes are absolute `MediaStream.Index` values, the numbering the server uses.
   * `undefined` means "not chosen": the server picks the default according to the user's
   * settings, and that choice is adopted as the current track once the server answers.
   * For subtitles, `-1` means "no subtitles".
   */
  mediaSourceIndexes: {
    itemId?: string;
    source?: number;
    video?: number;
    audio?: number;
    subtitle?: number;
  };
  remotePlaybackTime: number;
  remoteCurrentVolume: number;
  isRemotePlayer: boolean;
  isRemoteMuted: boolean;
  isShuffling: boolean;
  repeatMode: RepeatMode;
  queue: string[];
  originalQueue: string[];
  playbackInitiatorId?: BaseItemDto['Id'];
  playbackInitMode: InitMode;
  playbackSpeed: number;
}

/**
 * The negotiation of a playback with the server: the verdict it was based on and the server's answer
 */
interface Negotiation {
  itemId: string;
  mediaSourceId: string;
  mediaType: 'Video' | 'Audio';
  /**
   * Identifies the playback (item, version and play), for the state of Automatic
   */
  key: string;
  /**
   * The quality mode the verdict was computed with (in Automatic, with the level it runs at)
   */
  quality: QualityMode;
  /**
   * In Automatic, its state when the verdict was computed: what it goes back to when a step of Automatic gives
   * nothing playable and this playback goes on (see `RenegotiationIntent`)
   */
  autoState?: AutoState;
  verdict: Verdict;
  /**
   * The PlaybackInfo answer. Undefined when nothing was requested, because the verdict was unplayable.
   */
  data?: PlaybackInfoResponse;
  /**
   * The method the server chose (see `deriveActualMethod`), `Unplayable` without a playable answer
   */
  actualMethod: PlaybackMethod;
  /**
   * Why it must not be played, if it mustn't: nothing can play it (`unplayable`), or the server's answer
   * encodes something, which quality mode Original forbids (`quality`)
   */
  failure?: 'unplayable' | 'quality';
}

/**
 * What a hard failure of a negotiated playback would teach and which method would come next (see `getFailureStep`)
 */
function getNegotiationFailureStep(negotiation: Negotiation): FailureStep {
  return getFailureStep({
    method: negotiation.actualMethod,
    asked: negotiation.verdict.method,
    video: negotiation.verdict.video,
    audio: negotiation.verdict.audio,
    mediaType: negotiation.mediaType,
    mode: negotiation.quality,
    policy: getPlaybackPolicy()
  });
}

/**
 * The media source of a PlaybackInfo answer, if it has one: an answer with an error code, or without media sources,
 * plays nothing
 */
function getAnswerSource(data: PlaybackInfoResponse): MediaSourceInfo | undefined {
  return data.ErrorCode ? undefined : data.MediaSources?.[0];
}

/**
 * A hard failure of the current playback that is being handled: the playback is negotiated again one rung down the
 * ladder, and the answer for the same item with another play session resolves it
 */
interface PendingFailure {
  itemId: string;
  playSessionId?: string | null;
  from: PlaybackMethod;
  reason: PlaybackChangeReason;
}

/**
 * The play method reported to the server for each method
 */
const PLAY_METHODS: Readonly<Record<PlaybackMethod, PlayMethod | undefined>> = {
  DirectPlay: PlayMethod.DirectPlay,
  Remux: PlayMethod.DirectStream,
  TranscodeAudio: PlayMethod.Transcode,
  TranscodeVideo: PlayMethod.Transcode,
  Unplayable: undefined
};

/**
 * Playback of an item as reported to the server
 */
interface ReportedPlayback {
  itemId: string;
  mediaSourceId?: string | null;
  /**
   * Live stream opened by the server for this playback (Live TV). The server only closes it
   * (releasing the tuner) when the stop report carries it.
   */
  liveStreamId?: string | null;
  playSessionId?: string | null;
  /**
   * Last position reached while this item was the current one, in seconds
   */
  position?: number;
}

/**
 * == CLASS CONSTRUCTOR ==
 */
@sealed
class PlaybackManagerStore extends CommonStore<PlaybackManagerState> {
  /**
   * == NON REACTIVE STATE AND UTILITY VARIABLES ==
   * Reactive state is defined in the super() constructor
   */
  /**
   * Amount of time to wait between playback reports
   */
  private readonly _progressReportInterval = 3500;
  /**
   * Playback reported to the server as started (and not stopped yet). The progress and stop
   * reports use its ids, so the stop of an item carries its own play session even after the
   * state moved on to the next item.
   */
  private _reportedPlayback: ReportedPlayback | undefined;
  /**
   * Identifies the latest negotiation started: the answer of an older one is dropped
   */
  private _negotiationId = 0;
  /**
   * Whether a negotiation asked to replace the playback (see `RenegotiationIntent`) is in flight: one asked later
   * only to improve the playback takes its place, so it replaces the playback too
   */
  private _replacing = false;
  /**
   * The latest negotiation, for whatever item and version it was started
   */
  private readonly _negotiation = shallowRef<Negotiation>();
  /**
   * Incremented to negotiate the current playback again although none of its inputs changed (a learned floor
   * rose above the method being played)
   */
  private readonly _renegotiations = shallowRef(0);
  /**
   * The version resolved for an item no version was chosen for (see `_resolveMediaSource`), as an index in its
   * `MediaSources`. It only applies while that item is the current one.
   */
  private readonly _resolvedSource = shallowRef<{ itemId: string; index: number }>();
  /**
   * Identifies the latest version resolution started: the result of an older one is dropped
   */
  private _resolutionId = 0;
  /**
   * Whether the current playback has enough buffered ahead that reading other files can't make it wait:
   * `PREFETCH_BUFFER_AHEAD_S` beyond the current time, or up to the end of the item.
   *
   * The element's ranges are read live on every time update: `progress` events (what `mediaControls.buffered`
   * follows) can stop before the last bytes are buffered.
   */
  private readonly _bufferedAhead = computed(() => {
    const time = mediaControls.currentTime.value;
    const duration = mediaControls.duration.value;
    const ranges = mediaElementRef.value?.buffered;
    const target = Number.isFinite(duration) && duration > 0
      ? Math.min(time + PREFETCH_BUFFER_AHEAD_S, duration)
      : time + PREFETCH_BUFFER_AHEAD_S;
    const bufferedTo = time + (ranges ? getBufferedAhead(ranges, time) : 0);

    return !this.isRemotePlayer.value
      && !isNil(this.currentNegotiatedMediaSource.value)
      && bufferedTo >= target;
  });

  /**
   * Incremented on every play, so a new play of the same item and version starts Automatic again
   */
  private _playGeneration = 0;
  /**
   * The hard failure being handled, if any (see `reportPlaybackFailure`)
   */
  private _pendingFailure: PendingFailure | undefined;
  /**
   * == GETTERS AND SETTERS ==
   */
  public readonly status = computed(() => this._state.value.status);
  public readonly queueLength = computed(() => this._state.value.queue.length);
  public readonly repeatMode = computed(() => this._state.value.repeatMode);
  public readonly isBuffering = computed(() => this.status.value === PlaybackStatus.Buffering);
  public readonly isPlaying = computed(() => this.status.value !== PlaybackStatus.Stopped);
  public readonly isPaused = computed(() => this.status.value === PlaybackStatus.Paused);
  public readonly isRepeating = computed(() => this._state.value.repeatMode !== RepeatMode.RepeatNone);
  public readonly isShuffling = computed(() => this._state.value.isShuffling);
  public readonly isRepeatingAll = computed(() => this._state.value.repeatMode === RepeatMode.RepeatAll);
  public readonly isRepeatingOnce = computed(() => this._state.value.repeatMode === RepeatMode.RepeatOne);
  public readonly isRemotePlayer = computed(() => this._state.value.isRemotePlayer);
  public readonly playbackInitMode = computed(() => this._state.value.playbackInitMode);
  public readonly isMuted = computed({
    get: () => this.isRemotePlayer.value
      ? this._state.value.isRemoteMuted
      : mediaControls.muted.value,
    set: (newValue: boolean) => {
      if (this.isRemotePlayer.value) {
        this._state.value.isRemoteMuted = newValue;
      } else {
        mediaControls.muted.value = newValue;
      }
    }
  });

  /**
   * Map ids into BaseItemDto's objects of the queue
   */
  public readonly queue = computedAsync(async () => await apiStore.getItemsById(this._state.value.queue) as BaseItemDto[], []);
  public readonly initiator = computedAsync(async () => await apiStore.getItemById(this._state.value.playbackInitiatorId));
  public readonly currentItemIndex = computed({
    get: () => this._state.value.currentItemIndex,
    set: (newIndex: number | undefined) => {
      if (newIndex === this._state.value.currentItemIndex) {
        return;
      }

      this._state.value.currentItemIndex = newIndex;
      this.currentTime.value = 0;
    }
  });

  public readonly currentItemId = computed(() => this._state.value.queue[this.currentItemIndex.value ?? -1]);
  /**
   * The items of the queue are fetched asynchronously, so for a moment they might be those of the queue before its
   * last change: the current item is found by its id (see `findQueueItem`). A change that keeps it in the queue
   * (shuffle, moving items, "play next", removing another item) thus never makes it undefined, which would stop its
   * playback and start it again from the beginning.
   */
  public readonly currentItem = computed<BaseItemDto | undefined>(() =>
    findQueueItem(this.queue.value, this.currentItemId.value, this.currentItemIndex.value)
  );

  /**
   * Version of the current item being played, as an index in its `MediaSources`: the one the user chose for it or,
   * if none, the one resolved for it (see `_resolveMediaSource`). Undefined while it is being resolved.
   */
  public readonly currentMediaSourceIndex = computed(() => {
    const resolved = this._resolvedSource.value;

    return this._currentSelection.value?.source
      ?? (resolved && resolved.itemId === this.currentItemId.value ? resolved.index : undefined);
  });

  /**
   * Media source of the current item, as found in the /Items DTO. The server computes that DTO
   * without any device profile, so its device specific fields (`SupportsDirectPlay`, `TranscodingUrl`,
   * subtitle `DeliveryMethod`...) say nothing about this client: use it only for static metadata
   * (like the list of streams). Use `currentNegotiatedMediaSource` to decide how to play.
   *
   * Undefined while the version is being resolved, so nothing is negotiated for another one meanwhile.
   */
  public readonly currentMediaSource = computed(() => {
    const index = this.currentMediaSourceIndex.value;

    return isNil(index) ? undefined : this.currentItem.value?.MediaSources?.[index];
  });

  /**
   * Media source negotiated with the server for this device: `MediaSources[0]` of the PlaybackInfo
   * response. It's the only one that carries the device specific decisions of the server
   * (`SupportsDirectPlay`, `SupportsDirectStream`, `SupportsTranscoding`, `TranscodingUrl`,
   * `TranscodingSubProtocol`, `TranscodingContainer`, `DefaultAudioStreamIndex`,
   * `DefaultSubtitleStreamIndex` and the `DeliveryMethod`/`DeliveryUrl` of the subtitle streams),
   * so everything that decides how to play the current item must read them from here.
   *
   * Undefined until the server answers for the current item and version, and when the answer must not
   * be played (see `currentPlaybackFailure`).
   */
  public readonly currentNegotiatedMediaSource = computed(() => {
    const negotiation = this._currentNegotiation.value;

    return negotiation?.failure ? undefined : negotiation?.data?.MediaSources?.[0];
  });

  /**
   * The verdict the current playback was negotiated with: how this client expected to play it, and why
   */
  public readonly currentVerdict = computed(() => this._currentNegotiation.value?.verdict);
  /**
   * How the server decided to play the current item (see `deriveActualMethod`)
   */
  public readonly currentPlaybackMethod = computed(() => this._currentNegotiation.value?.actualMethod);
  /**
   * Why the current item can't be played, if it can't: nothing can play it (`unplayable`), or it would
   * have to be encoded, which quality mode Original forbids (`quality`)
   */
  public readonly currentPlaybackFailure = computed(() => this._currentNegotiation.value?.failure);
  /**
   * The quality mode the current playback was negotiated with: the preferred quality and, in Automatic, the level
   * it runs at
   */
  public readonly currentQualityMode = computed(() => this._currentNegotiation.value?.quality);
  /**
   * Identifies the current playback (item, version and play)
   */
  public readonly currentPlaybackKey = computed(() => this._currentNegotiation.value?.key);
  /**
   * The video stream the current playback was negotiated for (undefined for music)
   */
  public readonly currentPlayingVideoStream = computed(() => {
    const index = this._currentNegotiation.value?.verdict.video?.index;

    return isNil(index)
      ? undefined
      : this.currentMediaSource.value?.MediaStreams?.find(stream => stream.Type === MediaStreamType.Video && stream.Index === index);
  });

  /**
   * The quality menu entry equivalent to what is playing (see `getRunningEntry`), which Automatic shows as its
   * subtitle. Undefined while nothing plays or no entry is equivalent.
   */
  public readonly currentRunningQuality = computed(() => {
    const negotiation = this._currentNegotiation.value;

    if (negotiation && !negotiation.failure) {
      return getRunningEntry(
        this.currentPlayingVideoStream.value,
        negotiation.actualMethod,
        getModeLevel(negotiation.quality),
        getDecodedVideo(playbackObservations.videoSize.value)
      );
    }
  });

  /**
   * What a hard failure of the current playback would teach and which method would come next (see
   * `getFailureStep`), for the "try another method" action. Undefined while nothing plays.
   */
  public readonly currentFailureStep = computed(() => {
    const negotiation = this._currentNegotiation.value;

    if (negotiation && !negotiation.failure) {
      return getNegotiationFailureStep(negotiation);
    }
  });

  /**
   * Current tracks. They're read and written as absolute `MediaStream.Index` values
   * (see `PlaybackManagerState.mediaSourceIndexes` for the meaning of `undefined` and `-1`).
   *
   * When the user didn't choose a track, the current one is the one the server picked for
   * this device (`DefaultAudioStreamIndex`/`DefaultSubtitleStreamIndex` of the negotiated
   * media source), so the UI shows what is actually being played.
   */
  public readonly currentVideoTrack = computed({
    get: () => this._findStream(MediaStreamType.Video, this._currentSelection.value?.video),
    set: (newIndex: number | undefined) => {
      this._select('video', newIndex);
    }
  });

  public readonly currentAudioTrack = computed({
    get: () => this._findStream(MediaStreamType.Audio, this._currentAudioStreamIndex.value),
    set: (newIndex: number | undefined) => {
      this._select('audio', newIndex);
    }
  });

  public readonly currentSubtitleTrack = computed({
    get: () => this._findStream(MediaStreamType.Subtitle, this._currentSubtitleStreamIndex.value),
    set: (newIndex: number | undefined) => {
      this._select('subtitle', newIndex);
    }
  });

  /**
   * In milliseconds
   */
  public readonly currentItemRuntime = computed(() => this.currentItem.value ? getItemRuntime(this.currentItem.value) : 0);
  /**
   * In seconds
   */
  public readonly currentTime = computed({
    get: () => this.isRemotePlayer.value
      ? this._state.value.remotePlaybackTime
      : mediaControls.currentTime.value,
    set: (newValue: number) => {
      if (this.isRemotePlayer.value) {
        this._state.value.remotePlaybackTime = newValue;
      } else {
        mediaControls.currentTime.value = newValue;
      }
    }
  });

  public readonly currentVolume = computed({
    get: () => this.isRemotePlayer.value
      ? this._state.value.remoteCurrentVolume
      : mediaControls.volume.value * 100,
    set: (newVolume: number) => {
      newVolume = Math.min(newVolume, 100);
      this.isMuted.value = newVolume === 0;

      if (this.isRemotePlayer.value) {
        this._state.value.remoteCurrentVolume = newVolume;
      } else {
        mediaControls.volume.value = newVolume / 100;
      }
    }
  });

  /**
   * Primitive keys of the current item and media source. Computed refs only trigger their
   * dependents when their value changes, unlike the item objects, which are replaced on every refresh.
   */
  private readonly _currentItemDataId = computed(() => this.currentItem.value?.Id);
  private readonly _currentItemMediaType = computed(() => this.currentItem.value?.MediaType);
  private readonly _currentMediaSourceId = computed(() => this.currentMediaSource.value?.Id);

  /**
   * The negotiation of the current item and media source. While a new negotiation is in progress,
   * the previous one is kept only if it was made for the same item and media source (so a
   * re-negotiation doesn't interrupt playback), never one made for a previous item.
   */
  private readonly _currentNegotiation = computed(() => {
    const negotiation = this._negotiation.value;

    if (
      negotiation?.itemId === this._currentItemDataId.value
      && negotiation?.mediaSourceId === this._currentMediaSourceId.value
    ) {
      return negotiation;
    }
  });

  /**
   * Version and tracks explicitly chosen by the user, if they were chosen for the current item.
   */
  private readonly _currentSelection = computed(() => {
    const selection = this._state.value.mediaSourceIndexes;

    if (!isNil(selection.itemId) && selection.itemId === this.currentItemId.value) {
      return selection;
    }
  });

  /**
   * Absolute index of the audio stream being played: the one chosen by the user or,
   * if none, the one picked by the server. Undefined while unknown.
   */
  private readonly _currentAudioStreamIndex = computed(() =>
    this._currentSelection.value?.audio
    ?? this.currentNegotiatedMediaSource.value?.DefaultAudioStreamIndex
    ?? undefined
  );

  /**
   * Absolute index of the subtitle stream being played: the one chosen by the user or,
   * if none, the one picked by the server. `-1` when there are no subtitles.
   */
  private readonly _currentSubtitleStreamIndex = computed(() => {
    const index = this._currentSelection.value?.subtitle
      ?? this.currentNegotiatedMediaSource.value?.DefaultSubtitleStreamIndex;

    return isNil(index) || index < 0 ? -1 : index;
  });

  /**
   * How the server decided to play the current item, as reported to it: a remux (nothing encoded) is
   * a direct stream
   */
  private readonly _currentPlayMethod = computed(() => {
    const method = this.currentNegotiatedMediaSource.value ? this.currentPlaybackMethod.value : undefined;

    return method ? PLAY_METHODS[method] : undefined;
  });

  /**
   * Stores a track chosen by the user for the current item. Choices made for other
   * items are discarded, since they don't apply to this one.
   *
   * The state is written once, so the negotiation runs once for the change.
   */
  private readonly _select = (track: 'video' | 'audio' | 'subtitle', index?: number) => {
    this._state.value.mediaSourceIndexes = {
      ...(this._currentSelection.value ?? { itemId: this.currentItemId.value }),
      [track]: index
    };
  };

  /**
   * Finds a stream of the current media source by its absolute index
   */
  private readonly _findStream = (type: MediaStreamType, index?: number) =>
    isNil(index)
      ? undefined
      : this.currentMediaSource.value?.MediaStreams?.find(
          stream => stream.Type === type && stream.Index === index
        );

  public readonly currentSourceUrl = computed(() => this.getItemPlaybackUrl());

  /**
   * The fetched item at an index of the queue, found by its id (see `currentItem`)
   */
  private readonly _getQueueItem = (index: number | undefined): BaseItemDto | undefined =>
    findQueueItem(this.queue.value, isNil(index) ? undefined : this._state.value.queue[index], index);

  private readonly _previousItemIndex = computed(() => {
    if (this.isRepeatingAll.value && this._state.value.currentItemIndex === 0) {
      return this.queueLength.value - 1;
    }

    if (!isNil(this._state.value.currentItemIndex)) {
      return this._state.value.currentItemIndex - 1;
    }
  });

  public readonly previousItem = computed(() => this._getQueueItem(this._previousItemIndex.value));

  private readonly _nextItemIndex = computed(() => {
    if (this.isRepeatingAll.value && this._state.value.currentItemIndex === this.queueLength.value - 1) {
      return 0;
    }

    if (!isNil(this._state.value.currentItemIndex)) {
      return this._state.value.currentItemIndex + 1;
    }
  });

  public readonly nextItem = computed(() => this._getQueueItem(this._nextItemIndex.value));

  /**
   * Get the types of the currently playing item
   */
  public readonly currentlyPlayingMediaType = computed(() => this.currentItem.value?.MediaType);
  public readonly currentlyPlayingType = computed(() => this.currentItem.value?.Type);
  public readonly isVideo = computed(() => this.currentlyPlayingMediaType.value === 'Video');
  public readonly isAudio = computed(() => this.currentlyPlayingMediaType.value === 'Audio');

  /**
   * Get current's item audio tracks
   */
  public readonly currentItemAudioTracks = computed(() =>
    this.currentMediaSource.value?.MediaStreams?.filter(
      stream => stream.Type === MediaStreamType.Audio
    )
  );

  /**
   * Get current's item subtitle tracks
   */
  public readonly currentItemSubtitleTracks = computed(() =>
    this.currentMediaSource.value?.MediaStreams?.filter(
      stream => stream.Type === MediaStreamType.Subtitle
    )
  );

  public readonly playbackSpeed = computed({
    get: () => this._state.value.playbackSpeed,
    set: (newSpeed: number) => {
      this._state.value.playbackSpeed = newSpeed;
    }
  });

  /**
   * == ACTIONS ==
   */
  /**
   * Decides the version of the current item when none was chosen for it: the one this client plays best, or the
   * server's first one when automatic version selection is off (see `resolveMediaSourceIndex`, which waits for the
   * ranking a bounded time). A choice only applies to the item it was made for, so every other item of the queue gets
   * its own. It's decided once per item while it's current: a later change of what the ranking depends on doesn't
   * switch the version of a playback in progress.
   */
  private readonly _resolveMediaSource = async (): Promise<void> => {
    const id = ++this._resolutionId;
    const item = this.currentItem.value;

    if (
      !item?.Id
      || !isNil(this._currentSelection.value?.source)
      || this._resolvedSource.value?.itemId === item.Id
    ) {
      return;
    }

    const index = await resolveMediaSourceIndex(item);

    if (id === this._resolutionId && this.currentItemId.value === item.Id) {
      this._resolvedSource.value = { itemId: item.Id, index };
    }
  };

  /**
   * Why the server's answer must not be played, if it mustn't: it plays nothing (`unplayable`), or it encodes
   * something, which quality mode Original forbids (`quality`)
   */
  private readonly _getAnswerFailure = (actualMethod: PlaybackMethod): Negotiation['failure'] => {
    if (actualMethod === 'Unplayable') {
      return 'unplayable';
    }

    if ((actualMethod === 'TranscodeAudio' || actualMethod === 'TranscodeVideo') && playbackSettings.quality.value === 'original') {
      return 'quality';
    }
  };

  /**
   * Whether the playback in progress goes on instead of taking the result of a negotiation (see
   * `keepsCurrentPlayback`). When it does, Automatic goes back to the state that playback runs at, so later failures and
   * the user's "try another method" act on that playback.
   *
   * @param intent - Why it was negotiated (a negotiation in flight that replaces the playback makes it `replace`)
   * @param negotiation - What was negotiated
   * @param outcome - What the negotiation gave
   */
  private readonly _keepsPlayback = (
    intent: RenegotiationIntent,
    negotiation: Pick<Negotiation, 'itemId' | 'mediaSourceId' | 'key'>,
    outcome: RenegotiationOutcome
  ): boolean => {
    const playing = this._currentNegotiation.value;
    const works = !isNil(playing) && !isNil(playing.data) && !playing.failure
      && playing.itemId === negotiation.itemId && playing.mediaSourceId === negotiation.mediaSourceId;

    if (!keepsCurrentPlayback(intent, { playing: works, outcome }) || isNil(playing)) {
      return false;
    }

    if (playing.autoState && playing.key === negotiation.key) {
      restoreAutoState(playing.key, playing.autoState);
    }

    console.warn(`The playback goes on as it was: trying to improve it gave ${outcome === 'failed' ? 'no answer' : 'nothing playable'}`);

    return true;
  };

  /**
   * Stops handling the change of method under way for a playback, if any (see `_startFailure`): later failures of
   * that playback, and the user's "try another method", are handled again
   */
  private readonly _dropPendingFailure = (negotiation: Negotiation): void => {
    if (this._pendingFailure?.itemId === negotiation.itemId && this._pendingFailure.playSessionId === negotiation.data?.PlaySessionId) {
      this._pendingFailure = undefined;
    }
  };

  /**
   * Negotiates the playback of the current item and media source with the selected tracks: computes the
   * verdict and, unless nothing can play, asks the server for exactly that. Only the latest negotiation is
   * kept: the answer of an older one that arrives later is dropped.
   *
   * Whoever asks for it says why (see `RenegotiationIntent`): one that only tries to improve a playback that works,
   * and gives nothing playable or no answer, leaves that playback as it is.
   *
   * Reads the item objects without depending on them: they're replaced every time their data is refreshed
   * (for example, when the server notifies changes in the user data right after the playback start is
   * reported), and re-negotiating then would get a new play session and reload the stream.
   *
   * @param intent - Why it's negotiated
   */
  private readonly _negotiate = async (intent: RenegotiationIntent): Promise<void> => {
    const id = ++this._negotiationId;
    const item = this.currentItem.value;
    const mediaSource = this.currentMediaSource.value;
    const userId = remote.auth.currentUserId.value;
    const mediaType = item?.MediaType;

    this._replacing ||= intent === 'replace';

    const effectiveIntent: RenegotiationIntent = this._replacing ? 'replace' : 'improve';

    if (!item?.Id || !mediaSource?.Id || !userId || (mediaType !== 'Video' && mediaType !== 'Audio')) {
      this._replacing = false;
      this._negotiation.value = undefined;

      return;
    }

    const key = `${item.Id}|${mediaSource.Id}|${this._playGeneration}`;
    const target = { itemId: item.Id, mediaSourceId: mediaSource.Id, key };

    try {
      const selection = this._currentSelection.value;
      const video = getVideoStream(mediaSource, selection?.video);
      const quality = getPlaybackQualityMode(key, video);
      const autoState = quality.type === 'auto' ? getCurrentAutoState(key) : undefined;
      const verdict = await getMediaSourceVerdict(item, mediaSource, {
        videoStreamIndex: selection?.video,
        audioStreamIndex: selection?.audio,
        subtitleStreamIndex: selection?.subtitle
      }, { quality });

      if (id !== this._negotiationId) {
        return;
      }

      const negotiation = { itemId: item.Id, mediaSourceId: mediaSource.Id, mediaType, key, quality, autoState, verdict };

      /**
       * Nothing is requested that would make the server start a transcode no one can play. When only quality mode
       * Original stands in the way (a method it forbids would play), that's what the user is told.
       */
      if (verdict.method === 'Unplayable') {
        const failure = verdict.reasons.includes('NotAllowedByQuality') ? 'quality' : 'unplayable';

        this._replacing = false;

        if (!this._keepsPlayback(effectiveIntent, target, 'unplayable')) {
          this._negotiation.value = { ...negotiation, actualMethod: 'Unplayable', failure };
        }

        return;
      }

      const request = buildPlaybackRequest(verdict, mediaSource, SUBTITLE_RENDERERS);
      const { data } = await remote.sdk.newUserApi(getMediaInfoApi).getPostedPlaybackInfo({
        itemId: item.Id,
        playbackInfoDto: {
          ...request.options,
          DeviceProfile: request.deviceProfile,
          UserId: userId,
          AutoOpenLiveStream: true
        }
      });

      if (id !== this._negotiationId) {
        return;
      }

      const negotiated = getAnswerSource(data);
      const actualMethod = negotiated ? deriveActualMethod(negotiated) : 'Unplayable';
      const failure = this._getAnswerFailure(actualMethod);

      /**
       * The next verdict for these streams starts at the method the server needed. An answer without a media source (an
       * error code, which the server also sends for a media source id it does not know) teaches nothing.
       */
      if (negotiated && isMoreExpensive(actualMethod, verdict.method)) {
        recordPlaybackOutcome(verdict, { actualMethod });
      }

      this._replacing = false;

      if (failure && this._keepsPlayback(effectiveIntent, target, 'unplayable')) {
        return;
      }

      this._negotiation.value = { ...negotiation, data, actualMethod, failure };
    } catch {
      if (id === this._negotiationId) {
        this._replacing = false;

        if (!this._keepsPlayback(effectiveIntent, target, 'failed')) {
          const playing = this._currentNegotiation.value;

          this._state.value.status = PlaybackStatus.Error;
          useSnackbar(i18next.t('cantPlayItem'), 'error');

          /**
           * No answer resolves the change of method under way (a rung of the ladder, "try another method"): it's
           * dropped, so the user can try again on the playback that is still there
           */
          if (playing) {
            this._dropPendingFailure(playing);
          }
        }
      }
    }
  };

  /**
   * Reports that the player could not play the negotiated stream through media source playback because of a
   * codec error: it could not even create the buffer for it, so retrying is pointless. What failed is learned
   * (see `recordMediaSourceFailure`), which negotiates the playback again another way.
   */
  public readonly reportMediaSourceFailure = async (): Promise<void> => {
    const negotiation = this._startFailure('hlsCodecError');
    const item = this.currentItem.value;
    const mediaSource = this.currentMediaSource.value;

    if (negotiation && item && mediaSource) {
      this._renegotiateAfterFailure(negotiation, await recordMediaSourceFailure(item, mediaSource, negotiation.verdict));
    }
  };

  /**
   * Negotiates again after a hard failure was learned, when that changes the verdict: the learned floor is above the
   * method the failed verdict asked for, so the next one asks for more. A disproved answer negotiates again by itself
   * (see `renegotiatingEnvironment`). Otherwise nothing changed, and negotiating again would only repeat the failure.
   * The floor watcher may negotiate again too: both run as one negotiation.
   *
   * Every failure that negotiates again thus raises what is asked for (or disproves an answer, of which there are
   * few), so the ladder always ends: at worst in an unplayable verdict, which requests nothing and is shown as such.
   */
  private readonly _renegotiateAfterFailure = (negotiation: Negotiation, disproved: boolean): void => {
    const floor = getLearnedFloor(negotiation.verdict.signature);

    if (!disproved && floor !== undefined && isMoreExpensive(floor, negotiation.verdict.method)) {
      this._renegotiations.value++;
    }
  };

  /**
   * Starts handling a hard failure of the current playback, once per play session: the answer to the negotiation it
   * causes resolves it (see the negotiation watcher). Returns the negotiation that failed, or undefined when there's
   * nothing to handle.
   */
  private readonly _startFailure = (reason: PlaybackChangeReason): Negotiation | undefined => {
    const negotiation = this._currentNegotiation.value;
    const playSessionId = negotiation?.data?.PlaySessionId;

    if (
      !negotiation
      || negotiation.failure
      || (this._pendingFailure?.itemId === negotiation.itemId && this._pendingFailure.playSessionId === playSessionId)
    ) {
      return;
    }

    this._pendingFailure = { itemId: negotiation.itemId, playSessionId, from: negotiation.actualMethod, reason };

    return negotiation;
  };

  /**
   * Reports a hard failure of the current playback (or the user's "try another method"): it moves one rung down
   * the failure ladder (see `getFailureStep`) keeping the playback position, and the failure is learned for the
   * session, so the next playback of the same streams starts at a method that works. Only the first failure of a play
   * session counts.
   *
   * @param reason - What failed
   */
  public readonly reportPlaybackFailure = async (reason: PlaybackChangeReason): Promise<void> => {
    const negotiation = this._startFailure(reason);
    const item = this.currentItem.value;
    const mediaSource = this.currentMediaSource.value;

    if (!negotiation || !item || !mediaSource) {
      return;
    }

    const step = getNegotiationFailureStep(negotiation);
    let disproved = false;

    if (step.learn === 'floor') {
      recordPlaybackOutcome(negotiation.verdict, { failedAt: step.failedAt });
    } else if (step.learn === 'copied-audio') {
      disproved = await recordMediaSourceFailure(item, mediaSource, negotiation.verdict);
    }

    this._renegotiateAfterFailure(negotiation, disproved);
  };

  /**
   * Tells the user why the current item can't be played
   */
  private readonly _showPlaybackFailure = (negotiation: Negotiation): void => {
    const { t } = i18next;
    let dismiss: () => void;

    if (negotiation.failure === 'quality') {
      dismiss = useSnackbar(t('originalQualityUnavailable'), 'error', {
        text: t('switchToAutomatic'),
        onClick: () => {
          playbackSettings.quality.value = 'auto';
        }
      });
    } else if (negotiation.verdict.reasons.includes('FailedBefore') && negotiation.verdict.method === 'Unplayable') {
      // The methods left failed, or the policy forbids them: the menu says the same in this state
      const blockedBy = negotiation.verdict.reasons.includes('NotAllowedByPolicy') ? 'policy' : undefined;

      dismiss = useSnackbar(getNoOtherMethodText(t, blockedBy, true), 'error');
    } else if (negotiation.data && !getAnswerSource(negotiation.data)) {
      // The server answered without a media source: nothing was learned from it, and asking again may work
      dismiss = useSnackbar(t('cantPlayItem'), 'error', {
        text: t('retry'),
        onClick: () => {
          if (this.currentItemId.value === negotiation.itemId) {
            this._renegotiations.value++;
          }
        }
      });
    } else {
      dismiss = useSnackbar(t('cantPlayItem'), 'error');
    }

    /**
     * The notice is about this negotiation: it goes away when another one replaces it (the quality or the tracks
     * changed, another item plays, or the playback stopped). The one with a button has no timeout of its own.
     */
    const stop = watch(this._currentNegotiation, (current) => {
      if (current === negotiation) {
        return;
      }

      stop();
      dismiss();
    });
  };

  /**
   * Resolves the hard failure being handled with the answer to the negotiation it caused: the change is recorded and,
   * if the method changed and the user wants it, a notice tells the user. A negotiation for another item drops it.
   */
  private readonly _resolveFailure = (negotiation: Negotiation): void => {
    const pending = this._pendingFailure;

    if (!pending || (pending.itemId === negotiation.itemId && pending.playSessionId === negotiation.data?.PlaySessionId)) {
      return;
    }

    this._pendingFailure = undefined;

    if (pending.itemId !== negotiation.itemId) {
      return;
    }

    playbackObservations.lastChange.value = {
      kind: 'method',
      reason: pending.reason,
      from: pending.from,
      to: negotiation.actualMethod,
      at: Date.now()
    };

    if (!negotiation.failure && negotiation.actualMethod !== pending.from && playbackSettings.methodChangeNotices.value) {
      const method = getPlayingMethodName(i18next.t, negotiation.verdict, this.currentMediaSource.value, negotiation.actualMethod);

      useSnackbar(i18next.t('playbackMethodChanged', { method }), 'info');
    }
  };

  /**
   * Stops the transcode of a play session of this device on the server, instead of letting it time out
   */
  private readonly _stopTranscode = async (playSessionId: string): Promise<void> => {
    const api = remote.sdk.api;

    if (!api) {
      return;
    }

    try {
      /**
       * Not in the SDK: the server leaves its HLS endpoints out of the OpenAPI description. The SDK only
       * authenticates its own requests, so the header is set here.
       */
      await api.axiosInstance.delete(`${api.basePath}/Videos/ActiveEncodings`, {
        params: { deviceId: remote.sdk.deviceInfo.id, playSessionId },
        headers: { Authorization: api.authorizationHeader }
      });
    } catch {
      // The server ends it by itself when it times out
    }
  };

  /**
   * Data shared by the start and progress reports of a playback
   */
  private readonly _getPlaybackReportInfo = (playback: ReportedPlayback) => ({
    CanSeek: true,
    ItemId: playback.itemId,
    MediaSourceId: playback.mediaSourceId,
    LiveStreamId: playback.liveStreamId,
    PlaySessionId: playback.playSessionId,
    PlayMethod: this._currentPlayMethod.value,
    AudioStreamIndex: this._currentAudioStreamIndex.value,
    SubtitleStreamIndex: this._currentSubtitleStreamIndex.value,
    IsPaused: this.isPaused.value,
    PositionTicks: msToTicks(this.currentTime.value * 1000)
  });

  /**
   * Report current item playback progress to server. Only done once its start was reported.
   */
  private readonly _reportPlaybackProgress = async (): Promise<void> => {
    const playback = this._reportedPlayback;

    if (
      !playback
      || playback.itemId !== this.currentItemId.value
      || isNil(remote.auth.currentUser.value)
    ) {
      return;
    }

    await remote.sdk.newUserApi(getSessionApi).reportPlaybackProgress({
      playbackProgressInfo: this._getPlaybackReportInfo(playback)
    });
  };

  /**
   * Report playback stopped to the server. Used by the "Now playing" statistics in other clients.
   *
   * It ends the playback that was reported as started, with its own ids and the last position
   * it reached, even if the state already moved to another item (and reset the current time).
   * The server relies on that position to mark the item as played and to save the resume point.
   */
  private readonly _reportPlaybackStopped = async (): Promise<void> => {
    const playback = this._reportedPlayback;

    this._reportedPlayback = undefined;

    if (!playback || isNil(remote.auth.currentUser.value)) {
      return;
    }

    await remote.sdk.newUserApi(getSessionApi).reportPlaybackStopped({
      playbackStopInfo: {
        ItemId: playback.itemId,
        MediaSourceId: playback.mediaSourceId,
        LiveStreamId: playback.liveStreamId,
        PlaySessionId: playback.playSessionId,
        PositionTicks: msToTicks((playback.position ?? 0) * 1000)
      }
    });
  };

  /**
   * Report playback start to the server. Used by the "Now playing" statistics in other clients.
   */
  private readonly _reportPlaybackStart = async (playback: ReportedPlayback): Promise<void> => {
    this._reportedPlayback = { ...playback, position: this.currentTime.value };

    await remote.sdk.newUserApi(getSessionApi).reportPlaybackStart({
      playbackStartInfo: this._getPlaybackReportInfo(playback)
    });
  };

  public readonly queueHasItem = (itemId: string): boolean => this._state.value.queue.includes(itemId);
  /**
   * Adds an item (or the items of a folder) at the end of the queue. The queue is replaced, not mutated: the queue's
   * items are fetched by a computed that only tracks the queue property (the ids reach the database query as a raw
   * array), so a mutation in place would never fetch the added items.
   */
  public readonly addToQueue = async (item: BaseItemDto): Promise<void> => {
    const translatedItem = await this.translateItemsForPlayback(item);

    this._state.value.queue = [...this._state.value.queue, ...translatedItem];
  };

  /**
   * Removes an item from the queue (see `getQueueRemoval`). The queue is replaced, not mutated (see `addToQueue`), and
   * the current item keeps playing at its new index. If it's the one removed, the item that followed it plays, or the
   * playback stops when none did.
   */
  public readonly removeFromQueue = (itemId: string): void => {
    const removal = getQueueRemoval(this._state.value.queue, this._state.value.currentItemIndex, itemId, this.isRepeatingAll.value);

    if (!removal) {
      return;
    }

    if (removal.currentRemoved && isNil(removal.index)) {
      this.stop();

      return;
    }

    const original = this._state.value.originalQueue;

    this._state.value.queue = removal.queue;
    // While shuffling, turning shuffle off must not bring the item back
    this._state.value.originalQueue = original.includes(itemId) ? original.toSpliced(original.indexOf(itemId), 1) : original;
    this._state.value.currentItemIndex = removal.index;

    if (removal.currentRemoved) {
      this.currentTime.value = 0;
    }
  };

  public readonly clearQueue = (): void => {
    this._state.value.queue = [];
  };

  /**
   * Plays an item and initializes playbackManager's state
   */
  public readonly play = async ({
    item,
    audioTrackIndex,
    subtitleTrackIndex,
    videoTrackIndex,
    mediaSourceIndex,
    startFromIndex = 0,
    startFromTime = 0,
    initiator,
    startShuffled = false
  }: {
    item: BaseItemDto;
    audioTrackIndex?: number;
    subtitleTrackIndex?: number;
    videoTrackIndex?: number;
    mediaSourceIndex?: number;
    startFromIndex?: number;
    startFromTime?: number;
    initiator?: BaseItemDto;
    startShuffled?: boolean;
  }): Promise<void> => {
    try {
      if (this._state.value.status !== PlaybackStatus.Stopped) {
        this.stop();
      }

      this._playGeneration++;
      this._state.value.status = PlaybackStatus.Buffering;
      // A new playback decides its versions again, also for items played before
      this._resolvedSource.value = undefined;
      this._state.value.queue = await this.translateItemsForPlayback(item);
      /**
       * The version and tracks refer to the streams of `item` itself, so they only apply to it
       * (and never when it's a folder, since it isn't part of the queue)
       */
      this._state.value.mediaSourceIndexes = {
        itemId: item.Id,
        source: mediaSourceIndex,
        video: videoTrackIndex,
        audio: audioTrackIndex,
        subtitle: subtitleTrackIndex
      };
      this._state.value.currentItemIndex = startFromIndex;

      if (startShuffled) {
        await this.toggleShuffle(false);
      }

      this.currentTime.value = startFromTime;

      if (!startShuffled && initiator) {
        this._state.value.playbackInitMode = InitMode.Item;
      } else if (startShuffled && !initiator) {
        this._state.value.playbackInitMode = InitMode.Shuffle;
      } else if (startShuffled && initiator) {
        this._state.value.playbackInitMode = InitMode.ShuffleItem;
      } else {
        this._state.value.playbackInitMode = InitMode.Unknown;
      }

      this._state.value.playbackInitiatorId = initiator?.Id;

      this._state.value.status = PlaybackStatus.Playing;
    } catch {
      this._state.value.status = PlaybackStatus.Error;
    }
  };

  /**
   * Adds to the queue the items of a collection item (i.e album, tv show, etc...)
   *
   * @param item
   */
  public readonly playNext = async (item: BaseItemDto): Promise<void> => {
    const translatedItem = await this.translateItemsForPlayback(item);

    if (!isNil(this.currentItemIndex.value)) {
      /**
       * Removes the elements that already exists and append the new ones next to the currently playing item
       */
      const newQueue = this._state.value.queue.filter(
        index => !translatedItem.includes(index)
      );

      newQueue.splice(this.currentItemIndex.value + 1, 0, ...translatedItem);
      this.setNewQueue(newQueue);
    }
  };

  public readonly pause = (): void => {
    if (this._state.value.status === PlaybackStatus.Playing) {
      this._state.value.status = PlaybackStatus.Paused;
    }
  };

  public readonly unpause = (): void => {
    if (this._state.value.status === PlaybackStatus.Paused) {
      this._state.value.status = PlaybackStatus.Playing;
    }
  };

  public readonly playPause = (): void => {
    if (this._state.value.status === PlaybackStatus.Playing) {
      this.pause();
    } else if (this._state.value.status === PlaybackStatus.Paused) {
      this.unpause();
    }
  };

  public readonly setNextItem = (): void => {
    if (this.nextItem.value) {
      this.currentItemIndex.value = this._nextItemIndex.value;
    } else {
      this.stop();
    }

    this.currentTime.value = 0;
  };

  /**
   * Restarts the current item by default. It will go to the previous item only if the
   * current time is below 5 seconds.
   *
   * @param force - If true, it will change to the previous item (if it exists)
   * regardless of runtime.
   */
  public readonly setPreviousItem = (force = false): void => {
    if (!isNil(this.previousItem) && (force || this.currentTime.value < 5)) {
      this.currentItemIndex.value = this._previousItemIndex.value;
    }

    this.currentTime.value = 0;
  };

  public readonly setNewQueue = (queue: string[]): void => {
    if (!this.currentItemId.value) {
      return;
    }

    const newIndex = queue.indexOf(this.currentItemId.value);

    this._state.value.queue = queue;
    this._state.value.currentItemIndex = newIndex;
  };

  public readonly changeItemPosition = (
    itemId: string | undefined,
    newIndex: number
  ): void => {
    if (!(itemId && this.queueHasItem(itemId))) {
      return;
    }

    const newQueue = this._state.value.queue.filter(id => id !== itemId);

    newQueue.splice(newIndex, 0, itemId);
    this.setNewQueue(newQueue);
  };

  public readonly stop = (): void => {
    const volume = this.currentVolume.value;

    /**
     * Reported before resetting the state, which would report it again for the item change
     * (that second report is skipped, since there's no reported playback left by then)
     */
    void this._reportPlaybackStopped();
    this._reset();
    this.currentVolume.value = volume;
  };

  /**
   * Seek forward 15 seconds
   */
  public readonly skipForward = (): void => {
    this.currentTime.value = (this.currentTime.value || 0) + 15;
  };

  /**
   * Seek backwards 15 seconds
   */
  public readonly skipBackward = (): void => {
    this.currentTime.value
      = (this.currentTime.value || 0) > 15 ? (this.currentTime.value || 0) - 15 : 0;
  };

  /**
   * Increase volume by 5
   */
  public readonly volumeUp = (): void => {
    this.currentVolume.value = this.currentVolume.value + 5;
  };

  /**
   * Decrease volume by 5
   */
  public readonly volumeDown = (): void => {
    this.currentVolume.value = this.currentVolume.value - 5;
  };

  public readonly toggleShuffle = async (preserveCurrentItem = true): Promise<void> => {
    if (!isNil(this.currentItemId.value)) {
      if (this._state.value.isShuffling) {
        this._state.value.currentItemIndex = this._state.value.originalQueue.indexOf(this.currentItemId.value);
        this._state.value.queue = this._state.value.originalQueue;
        this._state.value.originalQueue = [];
        this._state.value.isShuffling = false;
      } else {
        const shuffled_queue
          = await runGenericWorkerFunc('shuffle')(this._state.value.queue) as string[];

        this._state.value.originalQueue = this._state.value.queue;

        if (preserveCurrentItem) {
          const itemIndex = shuffled_queue.indexOf(this.currentItemId.value);

          shuffled_queue.splice(itemIndex, 1);
          shuffled_queue.unshift(this.currentItemId.value);
        }

        this._state.value.queue = shuffled_queue;
        this._state.value.currentItemIndex = 0;
        this._state.value.isShuffling = true;
      }
    }
  };

  /**
   * Toggles between the different repeat modes
   *
   * If there's only one item in queue, we only switch between RepeatOne and RepeatNone
   */
  public readonly toggleRepeatMode = (): void => {
    if (this._state.value.repeatMode === RepeatMode.RepeatNone) {
      this._state.value.repeatMode
        = this.queueLength.value > 1
          ? RepeatMode.RepeatAll
          : RepeatMode.RepeatOne;
    } else if (this._state.value.repeatMode === RepeatMode.RepeatAll) {
      this._state.value.repeatMode
        = this.queueLength.value > 1
          ? RepeatMode.RepeatOne
          : RepeatMode.RepeatNone;
    } else {
      this._state.value.repeatMode = RepeatMode.RepeatNone;
    }
  };

  /**
   * Toggles the mute function
   *
   * If the volume is zero and isMuted is true, the volume returns to 100 when it is reactivated
   */
  public readonly toggleMute = (): void => {
    if (this.currentVolume.value === 0 && this.isMuted.value) {
      this.currentVolume.value = 100;
    }

    this.isMuted.value = !this.isMuted.value;
  };

  public readonly instantMixFromItem = async (itemId: string): Promise<void> => {
    const { data: items } = await useBaseItem(
      getInstantMixApi,
      'getInstantMixFromItem',
      { skipCache: { request: true } })(() => ({
      itemId
    }));

    for (const item of items.value) {
      await this.addToQueue(item);
    }
  };

  /**
   * Builds an array of item ids based on a collection item (i.e album, tv show, etc...)
   *
   * @param item
   */
  public readonly translateItemsForPlayback = async (
    item: BaseItemDto
  ): Promise<string[]> => {
    if (!item.Id) {
      return [];
    }

    const sortOrder
      = item.Type === BaseItemKind.Playlist || item.Type === BaseItemKind.BoxSet
        ? undefined
        : [ItemSortBy.SortName];
    const ids
      = item.Type === BaseItemKind.Program && item.ChannelId
        ? [item.ChannelId]
        : undefined;
    const artistIds
      = item.Type === BaseItemKind.MusicArtist ? [item.Id] : undefined;
    const parentId = item.IsFolder ? item.Id : undefined;
    let request: BaseItemDto[] = [];

    if (
      item.Type === BaseItemKind.Program
      || item.Type === BaseItemKind.Playlist
      || item.Type === BaseItemKind.MusicArtist
      || item.Type === BaseItemKind.MusicGenre
      || item.IsFolder
    ) {
      const { data: response } = await useBaseItem(getLibraryApi, 'getItems')(() => ({
        ids,
        artistIds,
        filters: [ItemFilter.IsNotFolder],
        parentId,
        recursive: true,
        sortBy: sortOrder
      }));

      request = response.value;
    } else if (
      item.Type === BaseItemKind.Episode
      && remote.auth.currentUser.value?.Configuration?.EnableNextEpisodeAutoPlay
      && item.SeriesId
    ) {
      /**
       * If autoplay is enabled and we have a seriesId, get the rest of the episodes
       */
      const { data: response } = await useBaseItem(getShowApi, 'getEpisodes')(() => ({
        seriesId: item.SeriesId!,
        isMissing: false,
        startItemId: item.Id
      }));

      request = response.value;
    }

    /** If no extra processing was needed, we add the item itself */
    if (request.length === 0) {
      request.push(item);
    }

    return request.map(i => i.Id!);
  };

  /**
   * Builds the URL that plays a media source, following the decision of the server:
   * - `SupportsDirectPlay`: the original file, as is (static URL).
   * - Otherwise, the stream described by `TranscodingUrl`: a remux or a transcode (see
   *   `deriveActualMethod`), always delivered as HLS since that's what the request asks for.
   *
   * Only the negotiated media source (from the PlaybackInfo response) has these decisions,
   * which is what's used by default.
   */
  public readonly getItemPlaybackUrl = (
    mediaSource = this.currentNegotiatedMediaSource.value,
    mediaType = this._currentNegotiation.value?.mediaType
  ): string | undefined => {
    if (mediaType && mediaSource?.SupportsDirectPlay) {
      return getStaticStreamUrl(mediaSource, mediaType, {
        deviceId: remote.sdk.deviceInfo.id,
        LiveStreamId: mediaSource.LiveStreamId ?? ''
      });
    }

    if (remote.sdk.api?.basePath && !mediaSource?.SupportsDirectPlay && mediaSource?.TranscodingUrl) {
      return `${remote.sdk.api.basePath}${mediaSource.TranscodingUrl}`;
    }
  };

  public constructor() {
    super({
      storeKey: 'playbackManager',
      defaultState: () => ({
        status: PlaybackStatus.Stopped,
        currentItemIndex: undefined,
        mediaSourceIndexes: {
          itemId: undefined,
          source: undefined,
          video: undefined,
          audio: undefined,
          subtitle: undefined
        },
        remotePlaybackTime: 0,
        remoteCurrentVolume: 100,
        isRemotePlayer: false,
        isRemoteMuted: false,
        isShuffling: false,
        repeatMode: RepeatMode.RepeatNone,
        queue: [],
        originalQueue: [],
        playbackInitiatorId: undefined,
        playbackInitMode: InitMode.Unknown,
        playbackSpeed: 1
      })
    });
    /**
     * Logic is divided by concerns and scope. Watchers for callbacks
     * that rely on the same variables might not be together. Categories:
     * - Status
     * - MediaSession
     * - Server interaction: Setting media sources and playback reporting
     * - Local media controls: Media element status changes performed outside this store.
     *   For example: The browser itself might expose direct controls to the underlying HTMLMediaElement.
     *   We want to keep track of these changes as well.
     */
    /**
     * == Status ==
     */
    watch(this.status,
      () => {
        if (
          this.status.value === PlaybackStatus.Playing
          && !mediaControls.playing.value
        ) {
          mediaControls.playing.value = true;
        } else if (
          this.status.value === PlaybackStatus.Paused
          && mediaControls.playing.value
        ) {
          mediaControls.playing.value = false;
        }
      }
    );

    /**
     * == MediaSession API: https://developer.mozilla.org/en-US/docs/Web/API/MediaSession ==
     */
    watchEffect(() => {
      const { t } = i18next;

      navigator.mediaSession.metadata = this.currentItem.value
        ? new MediaMetadata({
            title: this.currentItem.value.Name ?? t('unknownTitle'),
            artist: this.currentItem.value.AlbumArtist ?? t('unknownArtist'),
            album: this.currentItem.value.Album ?? t('unknownAlbum'),
            artwork: [96, 128, 192, 256, 384, 512].map(size => ({
              src:
                getImageInfo(this.currentItem.value, {
                  width: size
                }).url ?? '',
              sizes: `${size}x${size}`
            }))
          })
      /* eslint-disable-next-line unicorn/no-null */
        : null;
    });
    watchEffect(() => {
      switch (this.status.value) {
        case PlaybackStatus.Playing: {
          navigator.mediaSession.playbackState = 'playing';
          break;
        }
        case PlaybackStatus.Paused:
        case PlaybackStatus.Buffering: {
          navigator.mediaSession.playbackState = 'paused';
          break;
        }
        default: {
          navigator.mediaSession.playbackState = 'none';
        }
      }
    });
    watch(this.status,
      (newValue, oldValue) => {
        const remove
          = newValue === PlaybackStatus.Error
            || newValue === PlaybackStatus.Stopped;
        const add
          = oldValue === PlaybackStatus.Error
            || oldValue === PlaybackStatus.Stopped;

        if (remove || add) {
          const actionHandlers: Partial<Record<MediaSessionAction, MediaSessionActionHandler>> = {
            play: this.unpause,
            pause: this.pause,
            previoustrack: () => { this.setPreviousItem(); },
            nexttrack: this.setNextItem,
            stop: this.stop,
            seekbackward: this.skipBackward,
            seekforward: this.skipForward,
            seekto: (action): void => {
              this.currentTime.value = action.seekTime ?? 0;
            }
          };

          for (const action in actionHandlers) {
            try {
              navigator.mediaSession.setActionHandler(
                action as MediaSessionAction,
                /* eslint-disable-next-line unicorn/no-null */
                add ? actionHandlers[action as keyof typeof actionHandlers] ?? null : null
              );
            } catch {
              console.error(
                `The media session action "${action}" is not supported.`
              );
            }
          }
        }
      }
    );
    watchEffect(() => {
      const remove
        = this.status.value === PlaybackStatus.Error
          || this.status.value === PlaybackStatus.Stopped;

      if (this.currentTime.value <= this.currentItemRuntime.value) {
        const duration = this.currentItemRuntime.value / 1000;

        navigator.mediaSession.setPositionState(
          remove
            ? undefined
            : {
                duration,
                playbackRate: this.playbackSpeed.value,
                position: this.currentTime.value <= duration ? this.currentTime.value : 0
              }
        );
      }
    });

    /**
     * == Server interaction ==
     */
    /**
     * Report stop for the old item. The start of the new one is reported once
     * the server answers the PlaybackInfo request for it (see below)
     */
    watch(this.currentItemId,
      async (_, oldValue) => {
        if (oldValue) {
          await this._reportPlaybackStopped();
        }
      }
    );

    /**
     * Keep the position reached by the reported playback. Changing the current item resets the
     * current time synchronously, before any regular watcher runs, so the stop report can't read
     * it then. This watcher is synchronous so it sees the item change before the time reset,
     * and doesn't record the reset as the position of the previous item.
     */
    watch(this.currentTime, (time) => {
      const playback = this._reportedPlayback;

      if (!isNil(playback) && playback.itemId === this.currentItemId.value) {
        playback.position = time;
      }
    }, { flush: 'sync' });

    /**
     * Resolve the version of the current item when none was chosen for it. Until it's resolved there's no current
     * media source, so the negotiation below waits for it and runs once, for the resolved version.
     */
    watch([
      this._currentItemDataId,
      () => this._currentSelection.value?.source,
      () => this._resolvedSource.value?.itemId
    ], this._resolveMediaSource, { immediate: true });

    /**
     * Once the current playback has buffered ahead, compute the verdicts of the next item in the background: its files
     * are probed and the browser's answers memoised while this one plays, so its version and its negotiation are ready
     * when it starts. Waiting for the buffer keeps the probes from competing with this playback for the network.
     */
    watch(() => {
      const next = this.nextItem.value;

      return this._bufferedAhead.value && next?.Id !== this.currentItemId.value
        ? next?.Id
        : undefined;
    }, (nextId) => {
      const next = this.nextItem.value;

      if (nextId && next?.Id === nextId) {
        void prefetchMediaSourceVerdicts(next);
      }
    });

    /**
     * Negotiate the playback whenever what it depends on changes: the item and version, the
     * selected tracks, the settings and policy the verdict depends on, and a learned floor above
     * the method being played (see below). Only primitive values are watched, so refreshing the
     * item data doesn't re-negotiate. Every source is a getter or a computed: a shallow ref among
     * them would make Vue run the callback whenever any source is re-evaluated, even with the same
     * values. The result replaces the playback, whatever it is (see `RenegotiationIntent`).
     */
    watch([
      this._currentItemDataId,
      this._currentItemMediaType,
      this._currentMediaSourceId,
      () => remote.auth.currentUserId.value,
      () => this._currentSelection.value?.video,
      () => this._currentSelection.value?.audio,
      () => this._currentSelection.value?.subtitle,
      ...renegotiatingEnvironment,
      () => this._renegotiations.value
    ], () => this._negotiate('replace'), { immediate: true });

    /**
     * A step of Automatic (a supervisor moved its state) tries to improve a playback that works: negotiated again, it
     * replaces the playback only with something playable (see `RenegotiationIntent`)
     */
    watch(() => autoQualityRevision.value, () => this._negotiate('improve'));

    /**
     * When a playback teaches that the streams being played need more than the method the
     * server is using (for example, the media element can't switch to the selected audio track),
     * negotiate again: the new verdict starts at the learned floor.
     */
    watch(() => {
      const negotiation = this._currentNegotiation.value;
      const floor = negotiation ? getLearnedFloor(negotiation.verdict.signature) : undefined;

      return negotiation !== undefined && floor !== undefined && isMoreExpensive(floor, negotiation.actualMethod);
    }, (raised) => {
      if (raised) {
        this._renegotiations.value++;
      }
    });

    /**
     * A re-negotiation of the same item replaces the play session: stop the server's transcode of
     * the previous one, which would otherwise go on until it times out. It runs once the new source
     * was handed to the player, so the old stream is no longer read.
     */
    watch(this._currentNegotiation, (negotiation, previous) => {
      const previousSession = previous?.data?.PlaySessionId;

      if (
        previousSession
        && previous.itemId === negotiation?.itemId
        && previous.actualMethod !== 'DirectPlay'
        && !previous.failure
        && previousSession !== negotiation.data?.PlaySessionId
      ) {
        void this._stopTranscode(previousSession);
      }
    }, { flush: 'post' });

    /**
     * Report the playback start when the server answers the PlaybackInfo request of the
     * current item, so the report carries its play session, play method and tracks.
     * Later answers for the same item (re-negotiations, like after changing the quality or
     * the tracks) carry a new play session, which is passed on with a progress report.
     *
     * The reported playback is cleared whenever the current item changes or the playback
     * stops, so an answer for an item without it is always a new playback. An answer that must not
     * be played ends the reported playback of its item: it's reported as stopped (a playback reported
     * as started is always reported as stopped, whatever ends it).
     */
    watch(this._currentNegotiation, async (negotiation) => {
      if (!negotiation) {
        return;
      }

      this._resolveFailure(negotiation);

      if (negotiation.failure || !negotiation.data) {
        // Nothing plays any more: the playback reported as started for this item ends here
        if (this._reportedPlayback?.itemId === negotiation.itemId) {
          void this._reportPlaybackStopped();
        }

        this._state.value.status = PlaybackStatus.Error;
        this._showPlaybackFailure(negotiation);

        return;
      }

      const playback: ReportedPlayback = {
        itemId: negotiation.itemId,
        mediaSourceId: negotiation.data.MediaSources?.[0]?.Id ?? negotiation.mediaSourceId,
        liveStreamId: negotiation.data.MediaSources?.[0]?.LiveStreamId,
        playSessionId: negotiation.data.PlaySessionId
      };

      if (this._reportedPlayback?.itemId === playback.itemId) {
        this._reportedPlayback = { ...playback, position: this._reportedPlayback.position };
        await this._reportPlaybackProgress();
      } else {
        await this._reportPlaybackStart(playback);
      }
    });

    watchThrottled(
      this.currentTime,
      this._reportPlaybackProgress,
      { throttle: this._progressReportInterval }
    );
    watch(this.status, this._reportPlaybackProgress);

    /**
     * Report playback stop when closing the tab
     */
    globalThis.addEventListener('beforeunload', () => {
      void this._reportPlaybackStopped();
    });

    /**
     * == Local media controls ==
     */

    watch(mediaControls.playing, () => {
      if (
        this.status.value !== PlaybackStatus.Buffering
        && !this.isRemotePlayer.value
      ) {
        this._state.value.status = mediaControls.playing.value
          ? PlaybackStatus.Playing
          : PlaybackStatus.Paused;
      }
    });

    watch(mediaControls.waiting, () => {
      if (!this.isRemotePlayer.value) {
        this._state.value.status = mediaControls.waiting.value
          ? PlaybackStatus.Buffering
          : PlaybackStatus.Playing;
      }
    });

    watch(mediaControls.ended, () => {
      if (mediaControls.ended.value && !this.isRemotePlayer.value) {
        this.setNextItem();
      }
    });

    watch(this.playbackSpeed, () => {
      mediaControls.rate.value = this.playbackSpeed.value;

      if (mediaElementRef.value) {
        mediaElementRef.value.preservesPitch = true;
      }
    });

    /**
     * Report playback stop before logging out
     */
    remote.auth.onBeforeLogout(
      async () => {
        await this._reportPlaybackStopped();
        this._reset();
      }
    );
  }
}

export const playbackManager = new PlaybackManagerStore();
