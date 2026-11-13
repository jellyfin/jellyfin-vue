<template>
  <template v-if="mediaElementType">
    <Teleport
      :to="videoContainerRef"
      :disabled="!videoContainerRef"
      defer>
      <div class="uno-relative">
        <Component
          :is="mediaElementType"
          v-show="playbackManager.isVideo.value && videoContainerRef"
          ref="mediaElementRef"
          :poster="String(posterUrl)"
          :autoplay="!playbackManager.isPaused.value"
          crossorigin
          playsinline
          :loop="playbackManager.isRepeatingOnce.value"
          :class="{
            'uno-object-fill uno-w-screen': playerElement.state.value.isStretched,
            'uno-h-full uno-max-h-100vh': playbackManager.isVideo.value
          }"
          @loadedmetadata="onLoadedMetadata"
          @loadeddata="onLoadedData">
          <track
            v-for="sub in playerElement.currentItemVttParsedSubtitleTracks.value"
            :key="`${playbackManager.currentSourceUrl.value}-${sub.index}`"
            :data-stream-index="String(sub.index)"
            kind="subtitles"
            :label="sub.label"
            :srclang="sub.srcLang"
            :src="sub.src">
        </Component>
        <SubtitleTrack
          v-if="subtitleSettings.state.value.enabled && playerElement.currentParsedSubtitleTrack.value" />
      </div>
    </Teleport>
  </template>
</template>

<script setup lang="ts">
import Hls, { ErrorDetails, ErrorTypes, Events, PlaylistLevelType, type ErrorData } from 'hls.js';
import HlsWorkerUrl from 'hls.js/dist/hls.worker.js?url';
import { MediaStreamProtocol } from '@jellyfin/sdk/lib/generated-client';
import { computed, onScopeDispose, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import { PromiseQueue } from '@jellyfin-vue/shared/promises';
import { usePlaybackSupervisors } from '#/composables/use-playback-supervisors.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import {
  mediaElementRef,
  mediaWebAudio
} from '#/store/index.ts';
import { hlsDelivery } from '#/store/playback-capabilities.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import { playerElement, videoContainerRef } from '#/store/player-element.ts';
import { getImageInfo } from '#/utils/images.ts';
import { NO_NETWORK_ATTEMPTS, stepNetworkRecovery, type NetworkAttempts } from '#/utils/playback-capabilities/runtime-signals.ts';
import { subtitleSettings } from '#/store/settings/subtitle.ts';

interface PlaybackSource {
  url: string;
  /**
   * Whether the source must be played through hls.js instead of the media element's `src`
   */
  useHls: boolean;
  /**
   * Item the source plays
   */
  itemId?: string;
}

const { t } = useTranslation();
const webAudioQueue = new PromiseQueue();
/**
 * hls.js plays the server's HLS output only when that is how it reaches the element here (`hlsDelivery`, which the
 * verdicts are computed with); otherwise the element plays it natively, or it's never asked for
 */
const hls = hlsDelivery === 'media-source'
  ? new Hls({
      testBandwidth: false,
      workerPath: HlsWorkerUrl
    })
  : undefined;

const supervisors = usePlaybackSupervisors(hls);

const mediaElementType = computed<'audio' | 'video' | undefined>(() => {
  if (playbackManager.isAudio.value) {
    return 'audio';
  }

  if (playbackManager.isVideo.value) {
    return 'video';
  }
});

const posterUrl = computed(() =>
  !isNil(playbackManager.currentItem.value)
  && playbackManager.isVideo.value
    ? getImageInfo(playbackManager.currentItem.value, {
      preferBackdrop: true
    }).url
    : undefined
);

/**
 * How the current source must be loaded. It's decided only from the media source negotiated
 * with the server, for audio and video alike:
 * - Direct play: the original file, through the element's `src`.
 * - Transcode or remux delivered as HLS (`TranscodingSubProtocol` is `hls`): through hls.js when it
 *   runs here (`hlsDelivery`). Otherwise through `src`: the element plays HLS natively (an engine that plays
 *   neither is never offered HLS, see `hls-delivery.ts`).
 * - Any other transcode (a progressive HTTP stream): through `src`.
 */
const playbackSource = computed<PlaybackSource | undefined>(() => {
  const url = playbackManager.currentSourceUrl.value;
  const mediaSource = playbackManager.currentNegotiatedMediaSource.value;

  if (url && mediaSource) {
    return {
      url,
      useHls: !isNil(hls)
        && !mediaSource.SupportsDirectPlay
        && mediaSource.TranscodingSubProtocol === MediaStreamProtocol.Hls,
      itemId: playbackManager.currentItemId.value
    };
  }
});

/**
 * Media errors that mean the stream's codecs can't be played through media source here: hls.js couldn't create
 * the buffers for them. Recovering would fail the same way forever.
 */
const CODEC_ERRORS = new Set<ErrorData['details']>([
  ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR,
  ErrorDetails.BUFFER_INCOMPATIBLE_CODECS_ERROR,
  ErrorDetails.BUFFER_ADD_CODEC_ERROR
]);

/**
 * Network errors that mean the manifest (the master playlist) could not be loaded: resuming the load can't recover
 * them, since nothing was loaded from it yet
 */
const MANIFEST_ERRORS = new Set<ErrorData['details']>([
  ErrorDetails.MANIFEST_LOAD_ERROR,
  ErrorDetails.MANIFEST_LOAD_TIMEOUT,
  ErrorDetails.MANIFEST_PARSING_ERROR
]);

/**
 * The attempts to load the current source again after fatal network errors, per kind of failure, counted since the
 * playback last got past the fragment that failed (any fragment, when no fragment failed)
 */
const networkRecovery: { url?: string; attempts: NetworkAttempts; failedFragment?: number; timer?: ReturnType<typeof setTimeout> } = {
  attempts: NO_NETWORK_ATTEMPTS
};

/**
 * Whether an attempt was made since the playback last got past the point that failed
 */
const isRecovering = (): boolean => networkRecovery.attempts.manifest + networkRecovery.attempts.stream > 0;

/**
 * Forgets the attempts, for a new source or once the playback recovered
 */
function resetNetworkRecovery(url?: string): void {
  clearTimeout(networkRecovery.timer);
  Object.assign(networkRecovery, { url, attempts: NO_NETWORK_ATTEMPTS, failedFragment: undefined, timer: undefined });
}

/**
 * A fatal network error of hls.js: the stream stopped loading after hls.js's own retries. It's tried again a bounded
 * number of times for each kind of failure (`stepNetworkRecovery`), then the playback stops with an error, so the player
 * never stays frozen.
 * It never moves down the failure ladder: the network is not a capability of the browser.
 */
function onFatalNetworkError(data: ErrorData): void {
  const source = playbackSource.value;
  const el = mediaElementRef.value;

  if (!hls || !source?.useHls || !el) {
    return;
  }

  if (networkRecovery.url !== source.url) {
    resetNetworkRecovery(source.url);
  }

  const failure = MANIFEST_ERRORS.has(data.details) ? 'manifest' : 'stream';
  const { recovery, attempts } = stepNetworkRecovery(networkRecovery.attempts, failure);

  if (recovery.action === 'stop') {
    console.error(`hls.js could not load the stream (${data.details}) after ${networkRecovery.attempts[failure]} attempts`);
    resetNetworkRecovery();
    useSnackbar(t('playbackNetworkFailed'), 'error');
    playbackManager.stop();

    return;
  }

  if (!isRecovering()) {
    useSnackbar(t('networkError'), 'error');
  }

  console.error(`fatal network error (${data.details}), trying again in ${recovery.delayMs} ms`);
  networkRecovery.attempts = attempts;
  networkRecovery.failedFragment = typeof data.frag?.sn === 'number' ? data.frag.sn : undefined;
  clearTimeout(networkRecovery.timer);
  networkRecovery.timer = setTimeout(() => {
    // The playback moved on meanwhile (another source, or the player closed)
    if (playbackSource.value?.url !== source.url || hls.media !== el) {
      return;
    }

    const position = el.currentTime;

    if (recovery.action === 'reload') {
      hls.loadSource(source.url);
      // Loading the source again may reset the element: the playback goes on where it was
      el.currentTime = position;
    } else {
      hls.startLoad(position);
    }
  }, recovery.delayMs);
}

/**
 * The playback got past the fragment that failed: later network errors start counting again
 */
hls?.on(Events.FRAG_BUFFERED, (_event, data) => {
  const { failedFragment } = networkRecovery;

  if (isRecovering() && data.frag.type === PlaylistLevelType.MAIN
    && (failedFragment === undefined || (typeof data.frag.sn === 'number' && data.frag.sn > failedFragment))) {
    resetNetworkRecovery(networkRecovery.url);
  }
});

/**
 * Callback for when HLS.js gets an error
 */
function onHlsError(_event: typeof Hls.Events.ERROR, data: ErrorData): void {
  if (data.fatal && hls) {
    switch (data.type) {
      case ErrorTypes.NETWORK_ERROR: {
        onFatalNetworkError(data);
        break;
      }
      case ErrorTypes.MEDIA_ERROR: {
        if (CODEC_ERRORS.has(data.details)) {
          console.error(`media source playback failed (${data.details}), playing it another way`);
          void playbackManager.reportMediaSourceFailure();
          break;
        }

        // hls.js already reset the media source for this one: the supervisors count it, and resetting again would reload twice
        if (data.details === ErrorDetails.MEDIA_SOURCE_REQUIRES_RESET) {
          break;
        }

        // Recovered once; after that, the failure ladder plays it another way
        supervisors.onHlsMediaError();
        break;
      }
      default: {
        /**
         * Can't recover from unknown errors
         */
        useSnackbar(t('cantPlayItem'), 'error');
        playbackManager.stop();
        break;
      }
    }
  }
}

hls?.on(Events.ERROR, onHlsError);

/**
 * Detaches hls.js from the media element it's attached to, if any.
 * hls.js also removes its MediaSource from the element when detaching.
 */
function detachHls(): void {
  if (!hls?.media) {
    return;
  }

  hls.stopLoad();
  hls.detachMedia();
}

/**
 * Loads the source in the media element (or unloads the element if there's no source),
 * attaching hls.js only while the source needs it.
 */
function loadSource(el: HTMLMediaElement, source?: PlaybackSource): void {
  if (source?.useHls && hls) {
    if (hls.media === el) {
      hls.loadSource(source.url);
    } else {
      detachHls();
      hls.loadSource(source.url);
      hls.attachMedia(el);
    }

    return;
  }

  detachHls();

  if (source) {
    el.src = source.url;
  } else if (el.hasAttribute('src')) {
    /**
     * Unload the previous item, so the player doesn't keep (or restart) its playback.
     * This is the way the HTML spec recommends: setting `src` to a placeholder would
     * make the browser request it and fail with a media error.
     */
    el.removeAttribute('src');
    el.load();
  }
}

/**
 * Suspends WebAudio when no playback is in place
 */
async function detachWebAudio(): Promise<void> {
  const { context, sourceNode } = mediaWebAudio;

  if (context.value) {
    if (sourceNode.value) {
      sourceNode.value.disconnect();
      sourceNode.value = undefined;
    }

    await context.value.close();
    context.value = undefined;
  }
}

/**
 * Resumes WebAudio when playback is in place.
 *
 * It works the same whether the element plays a URL or a MediaSource attached by hls.js:
 * the source node takes the output of the element in both cases.
 */
async function attachWebAudio(el: HTMLMediaElement): Promise<void> {
  const { context, sourceNode } = mediaWebAudio;

  context.value = new AudioContext();
  sourceNode.value = context.value.createMediaElementSource(el);
  await context.value.resume();
  sourceNode.value.connect(context.value.destination);
}

/**
 * Called by the media element once it knows the tracks of what it loaded
 */
function onLoadedMetadata(event: Event): void {
  if (event.target instanceof HTMLMediaElement) {
    playerElement.applyAudioTrack(event.target);
  }
}

/**
 * Called by the media element when the playback is ready
 */
async function onLoadedData(): Promise<void> {
  if (!playbackManager.isVideo.value) {
    return;
  }

  if (mediaElementRef.value) {
    /**
     * Makes the resume start from the correct time
     */
    mediaElementRef.value.currentTime = playbackManager.currentTime.value;
  }

  await playerElement.applyCurrentSubtitle();
}

/**
 * Every new audio element gets its own WebAudio graph, after the previous one is closed
 */
watch(mediaElementRef, (el) => {
  void webAudioQueue.add(() => detachWebAudio());

  if (el instanceof HTMLAudioElement) {
    /**
     * The queue runs the task later: pass the element that triggered this callback,
     * not whatever the ref holds by then
     */
    void webAudioQueue.add(() => attachWebAudio(el));
  }
});

/**
 * (Re)loads the source when it changes or when the media element is replaced
 * (switching between audio and video items mounts a different element)
 */
watch([mediaElementRef, playbackSource], ([el, source], [oldEl, oldSource]) => {
  /**
   * Re-negotiations that keep the same URL (for example, changing the subtitle track while
   * playing the original file) must not reload the media
   */
  if (
    el === oldEl
    && source?.url === oldSource?.url
    && source?.useHls === oldSource?.useHls
  ) {
    return;
  }

  if (el) {
    /**
     * A new source for the item that the element is already playing comes from a re-negotiation
     * (quality, audio or subtitle change). Loading it resets the element to the start, so
     * playback must resume where it was. Setting the time on the element right after loading
     * the new source makes it the default playback start position of the new load (and what
     * the element reports as its current time until then, which the time ref picks up).
     */
    const resumeAt = el === oldEl && source && oldSource && source.itemId === oldSource.itemId
      ? el.currentTime
      : undefined;

    supervisors.startSource(source?.url);
    resetNetworkRecovery(source?.url);
    loadSource(el, source);

    if (resumeAt) {
      el.currentTime = resumeAt;
    }
  } else {
    detachHls();
  }
});

onScopeDispose(() => {
  resetNetworkRecovery();
  detachHls();
  hls?.destroy();
  void detachWebAudio();
});
</script>
