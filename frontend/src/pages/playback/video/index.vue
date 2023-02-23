<template>
  <v-main class="fill-height" :class="{ 'cursor-none': !osd }">
    <div class="fullscreen-video-container fill-height" />
    <osd-player
      v-model="osd"
      :is-fullscreen="fullscreen.isFullscreen.value"
      @toggle-fullscreen="toggleFullscreen" />
  </v-main>
</template>

<route lang="yaml">
meta:
  layout: fullpage
  transition: slideUp
</route>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useFullscreen } from '@vueuse/core';
import { playbackManagerStore, playerElementStore } from '@/store';
import { mediaElementRef } from '@/store/playbackManager';

const playbackManager = playbackManagerStore();
const playerElement = playerElementStore();

const osd = ref(true);

let fullscreen = useFullscreen(document.body);

/**
 * Toggles the fullscreen view, based on browsers supporting it or not (basically iOS or the others)
 */
function toggleFullscreen(): void {
  if (fullscreen.isSupported.value) {
    fullscreen.toggle();
  } else if (
    !fullscreen.isSupported.value &&
    // @ts-expect-error - Property 'webkitEnterFullScreen' does not exist on type 'HTMLMediaElement'
    mediaElementRef.value?.webkitEnterFullScreen
  ) {
    /**
     * Use case for iOS where the fullscreen methods on non <video> elements aren't supported
     */
    // TODO - if entering FS this way, SSA subs won't display. So we should trigger a new encode
    // @ts-expect-error - Property 'webkitEnterFullScreen' does not exist on type 'HTMLMediaElement'
    mediaElementRef.value?.webkitEnterFullScreen();
  }
}

onBeforeUnmount(() => {
  if (fullscreen.isFullscreen.value) {
    fullscreen.exit();
  }

  if (playerElement.isFullscreenVideoPlayer) {
    playbackManager.stop();
  }

  playerElement.isFullscreenMounted = false;
});

onMounted(() => {
  playerElement.isFullscreenMounted = true;
});
</script>

<style>
.fullscreen-video-container video {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 100%;
  max-height: 100%;
}

.fullscreen-video-container video.stretched {
  width: 100%;
  height: 100%;
}
</style>

<style scoped>
.fullscreen-video-container {
  background: black;
}
</style>
