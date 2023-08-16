<template>
  <VBtn
    icon
    :size="size"
    @click="playbackManager.setPreviousTrack">
    <VIcon :size="size">
      <IMdiSkipPrevious />
    </VIcon>
  </VBtn>
</template>

<script setup lang="ts">
import IMdiSkipPrevious from 'virtual:icons/mdi/skip-previous';
import { playbackManagerStore } from '@/store';

defineProps<{ size?: string }>();

const playbackManager = playbackManagerStore();
</script>
