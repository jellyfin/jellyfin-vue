<template>
  <template v-if="mediaElementType">
    <Teleport
      :to="teleportTarget"
      :disabled="!teleportTarget">
      <Component
        :is="mediaElementType"
        v-show="mediaElementType === 'video' && teleportTarget"
        ref="mediaElementRef"
        :poster="String(posterUrl)"
        autoplay
        crossorigin
        playsinline
        :loop="playbackManager.isRepeatingOnce"
        :class="{ stretched: playerElement.isStretched }"
        @loadeddata="onLoadedData">
        <track
          v-for="sub in playbackManager.currentItemVttParsedSubtitleTracks"
          :key="`${playbackManager.currentSourceUrl}-${sub.srcIndex}`"
          kind="subtitles"
          :label="sub.label"
          :srclang="sub.srcLang"
          :src="sub.src" />
      </Component>
    </Teleport>
  </template>
</template>

<script setup lang="ts">
import Hls, { ErrorTypes, Events, type ErrorData } from 'hls.js';
import HlsWorkerUrl from 'hls.js/dist/hls.worker.js?url';
import { computed, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSnackbar } from '@/composables/use-snackbar';
import {
  mediaElementRef,
  mediaWebAudio
} from '@/store';
import { playbackManager } from '@/store/playbackManager';
import { playerElement } from '@/store/playerElement';
import { getImageInfo } from '@/utils/images';
import { isNil } from '@/utils/validation';

const { t } = useI18n();

const hls = Hls.isSupported()
  ? new Hls({
    testBandwidth: false,
    workerPath: HlsWorkerUrl
  })
  : undefined;

/**
 * Detaches HLS instance after playback is done
 */
function detachHls(): void {
  if (hls) {
    hls.detachMedia();
    hls.off(Events.ERROR, onHlsEror);
  }
}

/**
 * Suspends WebAudio when no playback is in place
 */
async function detachWebAudio(): Promise<void> {
  if (mediaWebAudio.sourceNode) {
    mediaWebAudio.sourceNode.disconnect();
    mediaWebAudio.sourceNode = undefined;
  }

  await mediaWebAudio.context.suspend();
}

const mediaElementType = computed<'audio' | 'video' | undefined>(() => {
  if (playbackManager.currentlyPlayingMediaType === 'Audio') {
    return 'audio';
  } else if (playbackManager.currentlyPlayingMediaType === 'Video') {
    return 'video';
  }
});

/**
 * If the player is a video element and we're in the PiP player or fullscreen video playback,
 * we need to ensure the DOM elements are mounted before the teleport target is ready
 */
const teleportTarget = computed<
'.fullscreen-video-container' | '.minimized-video-container' | undefined
>(() => {
  if (playbackManager.currentlyPlayingMediaType === 'Video') {
    if (playerElement.isFullscreenMounted) {
      return '.fullscreen-video-container';
    } else if (playerElement.isPiPMounted) {
      return '.minimized-video-container';
    }
  }
});

const posterUrl = computed(() =>
  !isNil(playbackManager.currentItem) &&
  playbackManager.currentlyPlayingMediaType === 'Video'
    ? getImageInfo(playbackManager.currentItem, {
      preferBackdrop: true
    }).url
    : undefined
);

/**
 * Called by the media element when the playback is ready
 */
async function onLoadedData(): Promise<void> {
  if (playbackManager.currentlyPlayingMediaType === 'Video') {
    if (mediaElementRef.value) {
      /**
       * Makes the resume start from the correct time
       */
      mediaElementRef.value.currentTime = playbackManager.currentTime;
    }

    await playerElement.applyCurrentSubtitle();
  }
}

/**
 * Callback for when HLS.js gets an error
 */
function onHlsEror(_event: typeof Hls.Events.ERROR, data: ErrorData): void {
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

watch(
  () => [
    playbackManager.currentSubtitleStreamIndex,
    playerElement.isFullscreenMounted,
    playerElement.isPiPMounted
  ],
  async (newVal) => {
    if (newVal[1] || newVal[2]) {
      await playerElement.applyCurrentSubtitle();
    }
  }
);

watch(mediaElementRef, async () => {
  await nextTick();
  detachHls();
  await detachWebAudio();

  if (mediaElementRef.value) {
    if (mediaElementType.value === 'video' && hls) {
      hls.attachMedia(mediaElementRef.value);
      hls.on(Events.ERROR, onHlsEror);
    }

    await mediaWebAudio.context.resume();
    mediaWebAudio.sourceNode = mediaWebAudio.context.createMediaElementSource(
      mediaElementRef.value
    );
    mediaWebAudio.sourceNode.connect(mediaWebAudio.context.destination);
  }
});

watch(
  () => playbackManager.currentSourceUrl,
  (newUrl) => {
    if (hls) {
      hls.stopLoad();
    }

    if (
      mediaElementRef.value &&
      (!newUrl ||
      playbackManager.currentMediaSource?.SupportsDirectPlay ||
      !hls)
    ) {
      /**
       * For the video case, Safari iOS doesn't support hls.js but supports native HLS.
       *
       * We stringify undefined instead of skipping this block when there's no new source url,
       * so the player doesn't restart playback of the previous item
       */
      mediaElementRef.value.src = String(newUrl);
    } else if (
      hls &&
      playbackManager.currentlyPlayingMediaType === 'Video' &&
      newUrl
    ) {
      /**
       * We need to check if HLS.js can handle transcoded audio to remove the video check
       */
      hls.loadSource(newUrl);
    }
  }
);
</script>
