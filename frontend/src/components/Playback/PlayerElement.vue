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
            :key="`${playbackManager.currentSourceUrl.value}-${sub.srcIndex}`"
            kind="subtitles"
            :label="sub.label"
            :srclang="sub.srcLang"
            :src="sub.src">
        </Component>
        <SubtitleTrack
          v-if="subtitleSettings.state.value.enabled && playerElement.currentExternalSubtitleTrack.value?.parsed" />
      </div>
    </Teleport>
  </template>
</template>

<script setup lang="ts">
import Hls, { ErrorTypes, Events, type ErrorData } from 'hls.js';
import HlsWorkerUrl from 'hls.js/dist/hls.worker.js?url';
import { computed, nextTick, onScopeDispose, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import { PromiseQueue } from '@jellyfin-vue/shared/promises';
import { useSnackbar } from '#/composables/use-snackbar';
import {
  mediaElementRef,
  mediaWebAudio
} from '#/store';
import { playbackManager } from '#/store/playback-manager';
import { playerElement, videoContainerRef } from '#/store/player-element';
import { getImageInfo } from '#/utils/images';
import { subtitleSettings } from '#/store/settings/subtitle';

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
  } else if (playbackManager.isVideo.value) {
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
 * Resumes WebAudio when playback is in place
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
  if (playbackManager.isVideo.value) {
    if (mediaElementRef.value) {
      /**
       * Makes the resume start from the correct time
       */
      mediaElementRef.value.currentTime = playbackManager.currentTime.value;
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

watch(mediaElementRef, () => {
  detachHls();
  void webAudioQueue.add(() => detachWebAudio());

  if (mediaElementRef.value) {
    if (playbackManager.isVideo.value && hls) {
      hls.attachMedia(mediaElementRef.value);
      hls.on(Events.ERROR, onHlsEror);
    }

    if (playbackManager.isAudio.value) {
      void webAudioQueue.add(() => attachWebAudio(mediaElementRef.value!));
    }
  }
});

watch(playbackManager.currentSourceUrl,
  async (newUrl) => {
    if (hls) {
      hls.stopLoad();
    }

    /**
     * Ensure element is mounted before setting the source.
     */
    await nextTick();

    if (
      mediaElementRef.value
      && (!newUrl
        || playbackManager.currentMediaSource.value?.SupportsDirectPlay
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
      && playbackManager.isVideo.value
      && newUrl
    ) {
      /**
       * We need to check if HLS.js can handle transcoded audio to remove the video check
       */
      hls.loadSource(newUrl);
    }
  }
);

onScopeDispose(() => {
  detachHls();
  hls?.destroy();
  void detachWebAudio();
});
</script>
