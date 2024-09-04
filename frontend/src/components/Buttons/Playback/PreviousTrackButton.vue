<template>
  <VBtn
    v-bind="$attrs"
    icon
    @click="() => playbackManager.setPreviousItem()"
    @dblclick="() => playbackManager.setPreviousItem(true)">
    <VIcon v-bind="$attrs">
      <IMdiSkipPrevious />
    </VIcon>
  </VBtn>
</template>

<script setup lang="ts">
import IMdiSkipPrevious from 'virtual:icons/mdi/skip-previous';
import { playbackManager } from '@/store/playback-manager';
</script>
