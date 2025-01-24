<template>
  <VBtn
    v-bind="$attrs"
    icon
    :color="playbackManager.isRepeating.value ? 'primary' : undefined"
    @click.passive="playbackManager.toggleRepeatMode">
    <JIcon
      v-bind="$attrs"
      :class="playbackManager.repeatMode.value === RepeatMode.RepeatOne ? 'i-mdi:repeat-once' : 'i-mdi:repeat'" />
  </VBtn>
</template>

<script setup lang="ts">
import { RepeatMode, playbackManager } from '#/store/playback-manager';
</script>
