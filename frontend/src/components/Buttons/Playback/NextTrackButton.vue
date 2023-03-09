<template>
  <v-btn
    icon
    :size="props.size"
    :disabled="!playbackManager.nextItem"
    @click="playbackManager.setNextTrack">
    <v-icon :size="size">
      <i-mdi-skip-next />
    </v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { playbackManagerStore } from '@/store';

const props = defineProps<{ size?: string }>();
const playbackManager = playbackManagerStore();
</script>
