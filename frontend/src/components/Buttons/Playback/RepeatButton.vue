<template>
  <VBtn
    v-bind="$attrs"
    icon
    :color="playbackManager.isRepeating ? 'primary' : undefined"
    @click="playbackManager.toggleRepeatMode">
    <VIcon
      v-bind="$attrs"
      :icon="repeatIcon" />
  </VBtn>
</template>

<script setup lang="ts">
import IMdiRepeat from 'virtual:icons/mdi/repeat';
import IMdiRepeatOnce from 'virtual:icons/mdi/repeat-once';
import { computed } from 'vue';
import { RepeatMode, playbackManager } from '@/store/playback-manager';

const repeatIcon = computed(() =>
  playbackManager.repeatMode === RepeatMode.RepeatOne
    ? IMdiRepeatOnce
    : IMdiRepeat
);
</script>
