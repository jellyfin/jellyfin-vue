<template>
  <div
    class="j-transition uno-h-full">
    <component
      :is="comp">
      <slot />
    </component>
  </div>
</template>

<script setup lang="ts">
/**
 * TODO: Remove j-transition classes from this file once https://github.com/vuejs/core/issues/5148 is fixed
 */
import type { Component } from 'vue';

const { comp } = defineProps<{
  comp: Component;
}>();
</script>
