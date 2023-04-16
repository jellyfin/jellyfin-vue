<template>
  <v-btn
    variant="flat"
    width="1em"
    color="secondary"
    @click="useClipboardWrite(text)">
    <v-icon><i-mdi-content-copy /></v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { useClipboardWrite } from '@/composables/use-clipboard';

defineProps<{
  text: string;
}>();
</script>
