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
          @click.passive="playerElement.toggleFullscreenVideoPlayer">
          <JIcon class="i-mdi:arrow-expand-all" />
        </VBtn>
        <VSpacer />
        <VBtn
          icon
          @click.passive="playbackManager.stop">
          <JIcon class="i-mdi:close" />
        </VBtn>
      </div>
      <div
        class="uno-flex uno-flex-row uno-items-center uno-justify-center">
        <VBtn
          icon
          size="large"
          @click.passive="playbackManager.setPreviousItem">
          <JIcon class="i-mdi:skip-previous uno-text-lg" />
        </VBtn>
        <VBtn
          icon
          size="x-large"
          @click.passive="playbackManager.playPause">
          <JIcon
            class="uno-text-2xl"
            :class="{
              'i-mdi:play': playbackManager.isPaused.value,
              'i-mdi:pause': !playbackManager.isPaused.value,
            }" />
        </VBtn>
        <VBtn
          icon
          size="large"
          :disabled="!playbackManager.nextItem.value"
          @click.passive="playbackManager.setNextItem">
          <JIcon class="i-mdi:skip-next uno-text-lg" />
        </VBtn>
      </div>
    </JOverlay>
  </div>
</template>

<script setup lang="ts">
import { playbackManager } from '#/store/playback-manager';
import { playerElement, videoContainerRef } from '#/store/player-element';
</script>
