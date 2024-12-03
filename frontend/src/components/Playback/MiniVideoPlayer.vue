<template>
  <JHover v-slot="{ isHovering }">
    <VOverlay
      :model-value="true"
      persistent
      no-click-animation
      :scrim="false"
      scroll-strategy="none"
      content-class="uno-absolute uno-right-8 uno-bottom-8"
      :close-on-back="false"
      :width="$vuetify.display.mobile ? '60vw' : '25vw'">
      <div
        ref="videoContainerRef"
        class="minimized-video-container" />
      <JOverlay v-show="isHovering">
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
      </JOverlay>
    </VOverlay>
  </JHover>
</template>

<script setup lang="ts">
import { playbackManager } from '@/store/playback-manager';
import { playerElement, videoContainerRef } from '@/store/player-element';
</script>
