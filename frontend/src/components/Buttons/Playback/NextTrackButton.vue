<template>
  <VBtn
    icon
    :size="props.size"
    :disabled="!playbackManager.nextItem"
    @click="playbackManager.setNextItem">
    <VIcon :size="size">
      <IMdiSkipNext />
    </VIcon>
  </VBtn>
</template>

<script setup lang="ts">
import { playbackManager } from '@/store/playbackManager';

const props = defineProps<{ size?: string }>();
</script>
