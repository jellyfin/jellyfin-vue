<template>
  <VBtn
    v-bind="$attrs"
    icon
    @click.passive="() => playbackManager.setPreviousItem()"
    @dblclick.passive="() => playbackManager.setPreviousItem(true)">
    <JIcon
      v-bind="$attrs"
      class="i-mdi:skip-previous" />
  </VBtn>
</template>

<script setup lang="ts">
import { playbackManager } from '#/store/playback-manager';
</script>
