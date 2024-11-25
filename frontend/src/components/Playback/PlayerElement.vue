<template>
  <template v-if="mediaElementType">
    <Teleport
      :to="videoContainerRef"
      :disabled="!videoContainerRef"
      defer>
      <div class="uno-relative">
        <Component
          :is="mediaElementType"
          v-show="mediaElementType === 'video' && videoContainerRef"
          ref="mediaElementRef"
          :poster="String(posterUrl)"
          autoplay
          crossorigin
          playsinline
          :loop="playbackManager.isRepeatingOnce"
          class="uno-h-full uno-max-h-100vh"
          :class="{
            'uno-object-fill': playerElement.isStretched.value,
            'uno-w-screen': playerElement.isStretched.value
          }"
          @loadeddata="onLoadedData">
          <track
            v-for="sub in playbackManager.currentItemVttParsedSubtitleTracks"
            :key="`${playbackManager.currentSourceUrl}-${sub.srcIndex}`"
            kind="subtitles"
            :label="sub.label"
            :srclang="sub.srcLang"
            :src="sub.src">
        </Component>
        <SubtitleTrack
          v-if="subtitleSettings.state.enabled && playerElement.currentExternalSubtitleTrack?.parsed !== undefined" />
      </div>
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
import { playbackManager } from '@/store/playback-manager';
import { playerElement, videoContainerRef } from '@/store/player-element';
import { getImageInfo } from '@/utils/images';
import { isNil } from '@/utils/validation';
import { subtitleSettings } from '@/store/client-settings/subtitle-settings';

const { t } = useI18n();
let busyWebAudio = false;
const hls = Hls.isSupported()
  ? new Hls({
    testBandwidth: false,
    workerPath: HlsWorkerUrl
  })
  : undefined;

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
  if (mediaWebAudio.context.state === 'running' && !busyWebAudio) {
    busyWebAudio = true;

    try {
      if (mediaWebAudio.gainNode) {
        mediaWebAudio.gainNode.gain.setValueAtTime(mediaWebAudio.gainNode.gain.value, mediaWebAudio.context.currentTime);
        mediaWebAudio.gainNode.gain.exponentialRampToValueAtTime(0.0001, mediaWebAudio.context.currentTime + 1.5);
        await nextTick();
        await new Promise(resolve => globalThis.setTimeout(resolve));
        mediaWebAudio.gainNode.disconnect();
        mediaWebAudio.gainNode = undefined;
      }

      if (mediaWebAudio.sourceNode) {
        mediaWebAudio.sourceNode.disconnect();
        mediaWebAudio.sourceNode = undefined;
      }

      await mediaWebAudio.context.suspend();
    } catch {} finally {
      busyWebAudio = false;
    }
  }
}

/**
 * Resumes WebAudio when playback is in place
 */
async function attachWebAudio(el: HTMLMediaElement): Promise<void> {
  if (mediaWebAudio.context.state === 'suspended' && !busyWebAudio) {
    busyWebAudio = true;

    try {
      await mediaWebAudio.context.resume();

      mediaWebAudio.sourceNode = mediaWebAudio.context.createMediaElementSource(el);
      mediaWebAudio.sourceNode.connect(mediaWebAudio.context.destination);

      /**
       * The gain node is to avoid cracks when stopping playback or switching really fast between tracks
       */
      mediaWebAudio.gainNode = mediaWebAudio.context.createGain();
      mediaWebAudio.gainNode.connect(mediaWebAudio.context.destination);
      mediaWebAudio.gainNode.gain.setValueAtTime(mediaWebAudio.gainNode.gain.value, mediaWebAudio.context.currentTime);
      mediaWebAudio.gainNode.gain.exponentialRampToValueAtTime(1, mediaWebAudio.context.currentTime + 1.5);
    } catch {} finally {
      busyWebAudio = false;
    }
  }
}

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

watch(mediaElementRef, async () => {
  detachHls();
  await detachWebAudio();

  if (mediaElementRef.value) {
    if (mediaElementType.value === 'video' && hls) {
      hls.attachMedia(mediaElementRef.value);
      hls.on(Events.ERROR, onHlsEror);
    }

    await attachWebAudio(mediaElementRef.value);
  }
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
