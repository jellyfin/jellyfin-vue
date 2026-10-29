<template>
  <AvatarImage
    class="uno-aspect-square uno-h-full uno-w-full uno-object-cover"
    :src
    v-bind="{ alt }" />
</template>

<script setup lang="ts">
import { AvatarImage } from 'reka-ui';

const { alt, src } = defineProps<{
  alt?: string;
  src: string;
}>();
</script>
