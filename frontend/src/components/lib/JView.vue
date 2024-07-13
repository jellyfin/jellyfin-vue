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
import type { Component } from 'vue';

defineProps<{
  comp: Component;
}>();
</script>
