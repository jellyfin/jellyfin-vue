<template>
  <template v-if="mediaElementType">
    <Teleport :to="teleportTarget" :disabled="!teleportTarget">
      <component
        :is="mediaElementType"
        v-show="mediaElementType === 'video' && teleportTarget"
        ref="mediaElementRef"
        :poster="posterUrl"
        autoplay
        crossorigin="anonymous"
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
      </component>
    </Teleport>
  </template>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from 'vue';
import { isNil } from 'lodash-es';
import { useI18n } from 'vue-i18n';
import Hls, { ErrorData } from 'hls.js';
import {
  playbackManagerStore,
  playerElementStore,
  mediaElementRef
} from '@/store';
import { getImageInfo } from '@/utils/images';
import { useSnackbar } from '@/composables';
/**
 * Playback won't work in development until https://github.com/vuejs/core/pull/7593 is fixed
 */

const playbackManager = playbackManagerStore();
const playerElement = playerElementStore();
const { t } = useI18n();

const hls = Hls.isSupported()
  ? new Hls({
      testBandwidth: false
    })
  : undefined;

/**
 * Detaches HLS instance after playback is done
 */
function detachHls(): void {
  if (hls) {
    hls.detachMedia();
    hls.off(Hls.Events.ERROR, onHlsEror);
  }
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

const posterUrl = computed<string>(() =>
  !isNil(playbackManager.currentItem) &&
  playbackManager.currentlyPlayingMediaType === 'Video'
    ? getImageInfo(playbackManager.currentItem, {
        preferBackdrop: true
      }).url || ''
    : ''
);

/**
 * Called by the media element when the playback is ready
 */
async function onLoadedData(): Promise<void> {
  if (playbackManager.currentlyPlayingMediaType === 'Video') {
    if (mediaElementRef.value) {
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
      case Hls.ErrorTypes.NETWORK_ERROR: {
        // try to recover network error
        useSnackbar(t('errors.playback.networkError'), 'error');
        console.error('fatal network error encountered, try to recover');
        hls.startLoad();
        break;
      }
      case Hls.ErrorTypes.MEDIA_ERROR: {
        useSnackbar(t('errors.playback.mediaError'), 'error');
        console.error('fatal media error encountered, try to recover');
        hls.recoverMediaError();
        break;
      }
      default: {
        /**
         * Can't recover from unknown errors
         */
        useSnackbar(t('errors.cantPlayItem'), 'error');
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

  if (mediaElementRef.value && mediaElementType.value === 'video' && hls) {
    hls.attachMedia(mediaElementRef.value);
    hls.on(Hls.Events.ERROR, onHlsEror);
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
