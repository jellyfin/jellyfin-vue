<template>
  <JIcon
    v-if="indeterminate"
    :class="{
      'i-svg-spinners:ring-resize': indeterminate,
    }"
    v-bind="$attrs" />
</template>

<script setup lang="ts">
import JIcon from './JIcon.vue';

const { indeterminate } = defineProps<{
  indeterminate?: boolean;
}>();
</script>
