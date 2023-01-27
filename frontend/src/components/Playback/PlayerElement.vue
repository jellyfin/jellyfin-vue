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
        :loop="isLoopingOnce" />
    </Teleport>
  </template>
</template>

<script setup lang="ts">
/**
 * Shaka Player needs to be unmounted for it to be properly disposed. However,
 * since this component will always be mounted in the app (as it's inside the top-level App component),
 * it doesn't make sense to add code for handling the unmount process.
 */
// @ts-expect-error - This module doesn't have typings
import muxjs from 'mux.js';
// @ts-expect-error - This module doesn't have typings
import shakaPlayer from 'shaka-player/dist/shaka-player.compiled';
import { computed, watch } from 'vue';
import { isNil } from 'lodash-es';
import { playbackManagerStore, RepeatMode } from '@/store';
import { mediaElementRef } from '@/store/playbackManager';
import { getImageInfo } from '@/utils/images';

const playbackManager = playbackManagerStore();
let isShakaAttached = false;
const shaka = new shakaPlayer.Player();

window.muxjs = muxjs;
window.player = shaka;
shakaPlayer.polyfill.installAll();

const mediaElement = computed<'audio' | 'video' | undefined>(() => {
  if (playbackManager.currentlyPlayingMediaType === 'Audio') {
    return 'audio';
  } else if (playbackManager.currentlyPlayingMediaType === 'Video') {
    return 'video';
  }
});

/**
 * If the player is a video element and we're
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

const isLoopingOnce = computed(
  () => playbackManager.repeatMode === RepeatMode.RepeatOne
);

watch(mediaElement, async () => {
  await shaka.detach();
  isShakaAttached = false;

  if (mediaElementRef.value) {
    await shaka.attach(mediaElementRef.value);

    if (playbackManager.currentSourceUrl) {
      await shaka.load(playbackManager.currentSourceUrl);
    }

    isShakaAttached = true;
  }
});

watch(
  () => playbackManager.currentItemIndex,
  async () => {
    await shaka.unload();
  }
);

watch(
  () => playbackManager.currentSourceUrl,
  async () => {
    if (isShakaAttached && playbackManager.currentSourceUrl) {
      await shaka.load(playbackManager.currentSourceUrl);
    }
  }
);
</script>
