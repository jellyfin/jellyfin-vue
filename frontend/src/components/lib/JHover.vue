<template>
  <JSlot
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false">
    <slot
      :is-hovering="isHovering" />
  </JSlot>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';

const isHovering = shallowRef(false);
</script>
