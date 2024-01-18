<template>
  <VOverlay
    :model-value="true"
    persistent
    no-click-animation
    scrim
    scroll-strategy="none"
    content-class="minimized-overlay"
    :width="$vuetify.display.mobile ? '60vw' : '25vw'">
    <JHover v-slot="{ isHovering, hoverProps }">
      <div
        v-bind="hoverProps"
        class="minimized-video-container" />
      <VOverlay
        :model-value="isHovering"
        v-bind="hoverProps"
        contained
        scrim
        height="100%"
        width="100%">
        <div class="d-flex flex-column">
          <div class="d-flex flex-row">
            <VBtn
              icon
              @click="playerElement.toggleFullscreenVideoPlayer">
              <VIcon>
                <IMdiArrowExpandAll />
              </VIcon>
            </VBtn>
            <VSpacer />
            <VBtn
              icon
              @click="playbackManager.stop">
              <VIcon>
                <IMdiClose />
              </VIcon>
            </VBtn>
          </div>
          <div
            class="absolute-cover pointer-events-none d-flex flex-row justify-center align-center">
            <VBtn
              class="pointer-events-all"
              icon
              size="large"
              @click="() => playbackManager.setPreviousItem()">
              <VIcon size="32">
                <IMdiSkipPrevious />
              </VIcon>
            </VBtn>
            <VBtn
              class="pointer-events-all"
              icon
              size="x-large"
              @click="playbackManager.playPause">
              <VIcon size="48">
                <IMdiPlay v-if="playbackManager.isPaused" />
                <IMdiPause v-else />
              </VIcon>
            </VBtn>
            <VBtn
              class="pointer-events-all"
              icon
              size="large"
              @click="playbackManager.setNextItem">
              <VIcon size="32">
                <IMdiSkipNext />
              </VIcon>
            </VBtn>
          </div>
        </div>
      </VOverlay>
    </JHover>
  </VOverlay>
</template>

<script setup lang="ts">
import { useMagicKeys, whenever } from '@vueuse/core';
import { onBeforeUnmount, onMounted } from 'vue';
import { playbackManager } from '@/store/playbackManager';
import { playerElement } from '@/store/playerElement';

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
