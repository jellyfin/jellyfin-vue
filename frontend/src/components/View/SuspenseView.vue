<template>
  <Suspense
    v-bind="props"
    @pending="props.suspensible ? useLoading().start : undefined"
    @resolve="props.suspensible ? useLoading().finish : undefined">
    <slot />
  </Suspense>
</template>

<script setup lang="ts">
import { useLoading } from '@/composables';

const props = defineProps<{
  suspensible?: boolean;
}>();
</script>
