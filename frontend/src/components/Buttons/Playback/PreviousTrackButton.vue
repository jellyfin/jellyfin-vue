<template>
  <v-btn icon :size="size" @click="playbackManager.setPreviousTrack">
    <v-icon :size="size">
      <i-mdi-skip-previous />
    </v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import IMdiSkipPrevious from 'virtual:icons/mdi/skip-previous';
import { playbackManagerStore } from '@/store';

defineProps<{ size?: string }>();

const playbackManager = playbackManagerStore();
</script>
