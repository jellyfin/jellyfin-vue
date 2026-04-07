<template>
  <VBtn
    v-bind="$attrs"
    icon
    :disabled="!playbackManager.nextItem.value"
    @click="playbackManager.setNextItem">
    <JIcon
      v-bind="$attrs"
      class="i-mdi:skip-next" />
  </VBtn>
</template>

<script setup lang="ts">
import { playbackManager } from '#/store/playback-manager';
</script>
