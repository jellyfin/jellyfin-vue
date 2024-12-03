<template>
  <div
    ref="videoContainerRef"
    class="uno-absolute uno-bottom-8 uno-right-8 uno-w-100">
    <JOverlay
      scrim
      hover
      class="uno-flex uno-flex-col">
      <div class="uno-flex uno-flex-row">
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
        class="uno-flex uno-flex-row uno-items-center uno-justify-center">
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
            <IMdiPlay v-if="playbackManager.isPaused.value" />
            <IMdiPause v-else />
          </VIcon>
        </VBtn>
        <VBtn
          icon
          size="large"
          :disabled="!playbackManager.nextItem.value"
          @click="playbackManager.setNextItem">
          <VIcon size="32">
            <IMdiSkipNext />
          </VIcon>
        </VBtn>
      </div>
    </JOverlay>
  </div>
</template>

<script setup lang="ts">
import { playbackManager } from '#/store/playback-manager';
import { playerElement, videoContainerRef } from '#/store/player-element';
</script>
