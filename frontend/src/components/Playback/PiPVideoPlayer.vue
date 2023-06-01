<template>
  <v-overlay
    :model-value="true"
    persistent
    no-click-animation
    scrim
    scroll-strategy="none"
    content-class="minimized-overlay"
    :width="$vuetify.display.mobile ? '60vw' : '25vw'">
    <v-hover>
      <template #default="{ isHovering, props }">
        <div v-bind="props" class="minimized-video-container" />
        <v-overlay
          :model-value="isHovering"
          v-bind="props"
          contained
          scrim
          height="100%"
          width="100%">
          <div class="d-flex flex-column">
            <div class="d-flex flex-row">
              <v-btn icon @click="playerElement.toggleFullscreenVideoPlayer">
                <v-icon>
                  <i-mdi-arrow-expand-all />
                </v-icon>
              </v-btn>
              <v-spacer />
              <v-btn icon @click="playbackManager.stop">
                <v-icon>
                  <i-mdi-close />
                </v-icon>
              </v-btn>
            </div>
            <div
              class="absolute-cover pointer-events-none d-flex flex-row justify-center align-center">
              <v-btn
                class="pointer-events-all"
                icon
                size="large"
                @click="playbackManager.setPreviousTrack">
                <v-icon size="32">
                  <i-mdi-skip-previous />
                </v-icon>
              </v-btn>
              <v-btn
                class="pointer-events-all"
                icon
                size="x-large"
                @click="playbackManager.playPause">
                <v-icon size="48">
                  <i-mdi-play v-if="playbackManager.isPaused" />
                  <i-mdi-pause v-else />
                </v-icon>
              </v-btn>
              <v-btn
                class="pointer-events-all"
                icon
                size="large"
                @click="playbackManager.setNextTrack">
                <v-icon size="32">
                  <i-mdi-skip-next />
                </v-icon>
              </v-btn>
            </div>
          </div>
        </v-overlay>
      </template>
    </v-hover>
  </v-overlay>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useMagicKeys, whenever } from '@vueuse/core';
import { playbackManagerStore, playerElementStore } from '@/store';

const playerElement = playerElementStore();
const playbackManager = playbackManagerStore();

const keys = useMagicKeys();

whenever(keys.f, playerElement.toggleFullscreenVideoPlayer);

onMounted(() => {
  playerElement.isPiPMounted = true;
});

onBeforeUnmount(() => {
  /**
   * We need to destroy JASSUB so the canvas can be recreated in the other view
   */
  playerElement.freeSsaTrack();
  playerElement.isPiPMounted = false;
});
</script>

<style>
.minimized-overlay {
  position: absolute;
  right: 2em;
  bottom: 2em;
}

.minimized-video-container video {
  max-width: 100%;
  max-height: 100%;
}
</style>
