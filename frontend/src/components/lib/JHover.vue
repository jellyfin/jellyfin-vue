<template>
  <RSlot
    @pointerenter="isHovering = true"
    @pointerleave="isHovering = false">
    <slot
      :is-hovering="isHovering" />
  </RSlot>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';

const isHovering = shallowRef(false);
</script>
