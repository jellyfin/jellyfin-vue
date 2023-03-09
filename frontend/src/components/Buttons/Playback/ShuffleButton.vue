<template>
  <v-btn
    icon
    :size="size"
    :color="playbackManager.isShuffling ? 'primary' : undefined"
    @click="playbackManager.toggleShuffle">
    <v-icon :size="size">
      <i-mdi-shuffle />
    </v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { playbackManagerStore } from '@/store';

defineProps<{ size?: string }>();

const playbackManager = playbackManagerStore();
</script>
