<template>
  <template v-if="mediaElementType">
    <Teleport
      :to="videoContainerRef"
      :disabled="!videoContainerRef">
      <Component
        :is="mediaElementType"
        v-show="mediaElementType === 'video' && videoContainerRef"
        ref="mediaElementRef"
        :poster="String(posterUrl)"
        autoplay
        crossorigin
        playsinline
        :loop="playbackManager.isRepeatingOnce"
        :class="{ stretched: playerElement.isStretched.value }"
        @loadeddata="onLoadedData">
        <track
          v-for="sub in playbackManager.currentItemVttParsedSubtitleTracks"
          :key="`${playbackManager.currentSourceUrl}-${sub.srcIndex}`"
          kind="subtitles"
          :label="sub.label"
          :srclang="sub.srcLang"
          :src="sub.src" >
      </Component>
    </Teleport>
  </template>
</template>

<script setup lang="ts">
/**
 * This component should call detachHls and detachWebAudio when it's unmounted.
 * However, there's no onBeforeUnmount/onUnmounted lifecycle hook because in the current
 * App.vue setip, this component never unmounts.
 * 
 * If at some point this component is unmounted, the lifecycle hook must be added.
 */
import Hls, { ErrorTypes, Events, type ErrorData } from 'hls.js';
import HlsWorkerUrl from 'hls.js/dist/hls.worker.js?url';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSnackbar } from '@/composables/use-snackbar';
import {
  mediaElementRef,
  mediaWebAudio
} from '@/store';
import { playbackManager } from '@/store/playback-manager';
import { playerElement, videoContainerRef } from '@/store/player-element';
import { getImageInfo } from '@/utils/images';
import { isNil, promisifyTimeout } from '@/utils/validation';

const { t } = useI18n();
let attachingWebAudio = false;

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
 * Suspends WebAudio
 */
async function detachWebAudio(): Promise<void> {
  /**
   * We need this to avoid cracks when switching tracks really fast.
   * setValueAtTime and promisifyTimeout gives enough time for WebAudio to apply the gain, avoiding cracks
   */
  if (mediaWebAudio.gainNode) {
    mediaWebAudio.gainNode.gain.value = 0;
  }

  /**
   * This is needed so WebAudio has enough time to apply the gain.
   * nextTick is faster than this and doesn't ensure the event loop is not as busy, so it's not enough
   * for WebAudio to apply the gain.
   */
  await promisifyTimeout();
  await promisifyTimeout(() => {
    if (mediaWebAudio.context.state === 'running') {
      void mediaWebAudio.context.suspend();
    }
  });

  if (mediaWebAudio.sourceNode) {
    mediaWebAudio.sourceNode.disconnect();
    mediaWebAudio.sourceNode = undefined;
  }

  if (mediaWebAudio.gainNode) {
    mediaWebAudio.gainNode.disconnect();
    mediaWebAudio.gainNode = undefined;
  }
}

/**
 * Resumes and attaches WebAudio and all the nodes to the current element.
 */
async function attachWebAudio(): Promise<void> {
  await detachWebAudio();

  if (mediaElementRef.value && !attachingWebAudio) {
    attachingWebAudio = true;
    await mediaWebAudio.context.resume();
    mediaWebAudio.sourceNode = mediaWebAudio.context.createMediaElementSource(
      mediaElementRef.value
    );
    mediaWebAudio.gainNode = mediaWebAudio.context.createGain();
    mediaWebAudio.sourceNode.connect(mediaWebAudio.context.destination);
    mediaWebAudio.sourceNode.connect(mediaWebAudio.gainNode);
    attachingWebAudio = false;
  }
}

const mediaElementType = computed<'audio' | 'video' | undefined>(() => {
  if (playbackManager.isAudio) {
    return 'audio';
  } else if (playbackManager.isVideo) {
    return 'video';
  }
});

const posterUrl = computed(() =>
  !isNil(playbackManager.currentItem)
  && playbackManager.isVideo
    ? getImageInfo(playbackManager.currentItem, {
      preferBackdrop: true
    }).url
    : undefined
);

/**
 * Called by the media element when the playback is ready
 */
async function onLoadedData(): Promise<void> {
  if (playbackManager.isVideo) {
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
        hls.startLoad(playbackManager.currentTime);
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

watch(mediaElementRef, () => {
  detachHls();

  if (mediaElementRef.value) {
    if (mediaElementType.value === 'video' && hls) {
      hls.attachMedia(mediaElementRef.value);
      hls.on(Events.ERROR, onHlsEror);
    }
  }

  void attachWebAudio();
});

watch(
  () => playbackManager.currentSourceUrl,
  (newUrl) => {
    if (hls) {
      hls.stopLoad();
    }

    if (
      mediaElementRef.value
      && (!newUrl
      || playbackManager.currentMediaSource?.SupportsDirectPlay
      || !hls)
    ) {
      /**
       * For the video case, Safari iOS doesn't support hls.js but supports native HLS.
       *
       * We stringify undefined instead of skipping this block when there's no new source url,
       * so the player doesn't restart playback of the previous item
       */
      mediaElementRef.value.src = String(newUrl);
    } else if (
      hls
      && playbackManager.isVideo
      && newUrl
    ) {
      /**
       * We need to check if HLS.js can handle transcoded audio to remove the video check
       */
      hls.loadSource(newUrl);
    }
  }
);
</script>

<style scoped>
.stretched {
  object-fit: fill;
}
</style>
