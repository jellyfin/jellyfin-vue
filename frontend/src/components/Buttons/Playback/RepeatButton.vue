<template>
  <VBtn
    icon
    :size="size"
    :color="playbackManager.isRepeating ? 'primary' : undefined"
    @click="playbackManager.toggleRepeatMode">
    <VIcon
      :size="size"
      :icon="repeatIcon" />
  </VBtn>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IMdiRepeatOnce from 'virtual:icons/mdi/repeat-once';
import IMdiRepeat from 'virtual:icons/mdi/repeat';
import { playbackManagerStore } from '@/store';
import { RepeatMode } from '@/store/playbackManager';

defineProps<{ size?: string }>();

const playbackManager = playbackManagerStore();

const repeatIcon = computed(() =>
  playbackManager.repeatMode === RepeatMode.RepeatOne
    ? IMdiRepeatOnce
    : IMdiRepeat
);
</script>
