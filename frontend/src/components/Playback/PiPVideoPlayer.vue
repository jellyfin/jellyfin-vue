<template>
  <JHover v-slot="{ isHovering }">
    <VOverlay
      :model-value="true"
      persistent
      no-click-animation
      :scrim="false"
      scroll-strategy="none"
      content-class="minimized-overlay"
      :width="$vuetify.display.mobile ? '60vw' : '25vw'">
      <div
        ref="videoContainerRef"
        class="minimized-video-container" />
      <VOverlay
        :model-value="isHovering"
        contained
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
            class="d-flex flex-row justify-center align-center">
            <VBtn
              icon
              size="large"
              @click="playbackManager.setPreviousItem">
              <VIcon size="32">
                <IMdiSkipPrevious />
              </VIcon>
            </VBtn>
            <VBtn
              icon
              size="x-large"
              @click="playbackManager.playPause">
              <VIcon size="48">
                <IMdiPlay v-if="playbackManager.isPaused" />
                <IMdiPause v-else />
              </VIcon>
            </VBtn>
            <VBtn
              icon
              size="large"
              :disabled="!playbackManager.nextItem"
              @click="playbackManager.setNextItem">
              <VIcon size="32">
                <IMdiSkipNext />
              </VIcon>
            </VBtn>
          </div>
        </div>
      </VOverlay>
    </VOverlay>
  </JHover>
</template>

<script setup lang="ts">
import { playbackManager } from '@/store/playback-manager';
import { playerElement, videoContainerRef } from '@/store/player-element';
</script>

<style scoped>
:deep(.minimized-overlay) {
  position: absolute;
  right: 2em;
  bottom: 2em;
}

:deep(.minimized-video-container video) {
  max-width: 100%;
  max-height: 100%;
}
</style>
