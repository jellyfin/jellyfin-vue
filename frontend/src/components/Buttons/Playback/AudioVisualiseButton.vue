<template>
  <v-btn
    icon
    :size="size"
    :color="playerElement.isVisualising ? 'primary' : undefined"
    @click="playerElement.toggleVisualiser">
    <v-icon :size="size">
      <i-mdi-chart-bar />
    </v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { playerElementStore } from '@/store';

defineProps<{ size?: string }>();

const playerElement = playerElementStore();
</script>
