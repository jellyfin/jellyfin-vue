<template>
  <AvatarFallback
    class="uno-inline-flex uno-h-full uno-w-full uno-items-center uno-justify-center"
    :delay-ms>
    <slot />
  </AvatarFallback>
</template>

<script setup lang="ts">
import { AvatarFallback } from 'reka-ui';

const { delayMs } = defineProps<{
  delayMs?: number;
}>();
</script>
