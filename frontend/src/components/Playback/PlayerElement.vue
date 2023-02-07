<template>
  <template v-if="mediaElement">
    <Teleport :to="teleportTarget">
      <component
        :is="mediaElement"
        ref="mediaElementRef"
        :poster="posterUrl"
        autoplay
        crossorigin="anonymous"
        playsinline
        :loop="playbackManager.isRepeatingOnce" />
    </Teleport>
  </template>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { isNil } from 'lodash-es';
import { useI18n } from 'vue-i18n';
import { playbackManagerStore } from '@/store';
import { mediaElementRef } from '@/store/playbackManager';
import { getImageInfo } from '@/utils/images';
import { useSnackbar } from '@/composables';

const playbackManager = playbackManagerStore();
const { t } = useI18n();

const mediaElement = computed<'audio' | 'video' | undefined>(() => {
  if (playbackManager.currentlyPlayingMediaType === 'Audio') {
    return 'audio';
  } else if (playbackManager.currentlyPlayingMediaType === 'Video') {
    return 'video';
  }
});

/**
 * If the player is a video element and we're in the PiP player or fullscreen video playback, we need to ensure the DOM elements are mounted before the teleport target is ready
 */
const teleportTarget = computed<'body' | '.video-container'>(() =>
  mediaElement.value === 'audio' ? 'body' : '.video-container'
);

const posterUrl = computed<string>(() =>
  !isNil(playbackManager.currentItem) && mediaElement.value === 'video'
    ? getImageInfo(playbackManager.currentItem, {
        preferBackdrop: true
      }).url || ''
    : ''
);

watch(
  () => playbackManager.currentSourceUrl,
  () => {
    if (
      mediaElementRef.value &&
      playbackManager.currentSourceUrl &&
      playbackManager.currentMediaSource?.SupportsDirectPlay &&
      playbackManager.currentlyPlayingMediaType === 'Audio'
    ) {
      mediaElementRef.value.src = playbackManager.currentSourceUrl;
    } else {
      useSnackbar(t('errors.cantPlayItem'), 'error');
      playbackManager.stop();
    }
  }
);
</script>
