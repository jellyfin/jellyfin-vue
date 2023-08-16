<template>
  <VBtn
    icon
    :size="props.size"
    :disabled="!playbackManager.nextItem"
    @click="playbackManager.setNextTrack">
    <VIcon :size="size">
      <IMdiSkipNext />
    </VIcon>
  </VBtn>
</template>

<script setup lang="ts">
import { playbackManagerStore } from '@/store';

const props = defineProps<{ size?: string }>();
const playbackManager = playbackManagerStore();
</script>
