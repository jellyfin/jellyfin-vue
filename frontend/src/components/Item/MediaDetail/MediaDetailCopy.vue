<template>
  <v-btn variant="flat" width="1em" color="secondary" @click="writeToClipboard">
    <v-icon><i-mdi-content-copy /></v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { writeToClipboard } from '@/utils/clipboard';

defineProps<{
  text: string;
}>();
</script>
