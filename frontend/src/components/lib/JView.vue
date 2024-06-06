<template>
  <div
    class="uno-h-full j-transition">
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
