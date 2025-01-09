<template>
  <JSlot
    @pointerenter.passive="isHovering = true"
    @pointerleave.passive="isHovering = false">
    <slot
      :is-hovering="isHovering" />
  </JSlot>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';

const isHovering = shallowRef(false);
</script>
