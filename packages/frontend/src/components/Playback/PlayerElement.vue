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
          autoplay
          crossorigin
          playsinline
          :loop="playbackManager.isRepeatingOnce.value"
          :class="{
            'uno-object-fill uno-w-screen': playerElement.state.value.isStretched,
            'uno-h-full uno-max-h-100vh': playbackManager.isVideo.value
          }"
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
import Hls, { ErrorTypes, Events, type ErrorData } from 'hls.js';
import HlsWorkerUrl from 'hls.js/dist/hls.worker.js?url';
import { MediaStreamProtocol } from '@jellyfin/sdk/lib/generated-client';
import { computed, onScopeDispose, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import { PromiseQueue } from '@jellyfin-vue/shared/promises';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import {
  mediaElementRef,
  mediaWebAudio
} from '#/store/index.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import { playerElement, videoContainerRef } from '#/store/player-element.ts';
import { getImageInfo } from '#/utils/images.ts';
import { subtitleSettings } from '#/store/settings/subtitle.ts';

interface PlaybackSource {
  url: string;
  /**
   * Whether the source must be played through hls.js instead of the media element's `src`
   */
  useHls: boolean;
}

const { t } = useTranslation();
const webAudioQueue = new PromiseQueue();
const hls = Hls.isSupported()
  ? new Hls({
      testBandwidth: false,
      workerPath: HlsWorkerUrl
    })
  : undefined;

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
 * - Transcode or remux delivered as HLS (`TranscodingSubProtocol` is `hls`): through hls.js when
 *   it's available. Otherwise (no MediaSource nor ManagedMediaSource), through `src`, relying on
 *   the browser's native HLS support.
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
        && mediaSource.TranscodingSubProtocol === MediaStreamProtocol.Hls
    };
  }
});

/**
 * Callback for when HLS.js gets an error
 */
function onHlsError(_event: typeof Hls.Events.ERROR, data: ErrorData): void {
  if (data.fatal && hls) {
    switch (data.type) {
      case ErrorTypes.NETWORK_ERROR: {
        // Try to recover network error
        useSnackbar(t('networkError'), 'error');
        console.error('fatal network error encountered, try to recover');
        hls.startLoad();
        break;
      }
      case ErrorTypes.MEDIA_ERROR: {
        useSnackbar(t('mediaError'), 'error');
        console.error('fatal media error encountered, try to recover');
        hls.recoverMediaError();
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
    loadSource(el, source);
  } else {
    detachHls();
  }
});

onScopeDispose(() => {
  detachHls();
  hls?.destroy();
  void detachWebAudio();
});
</script>
