<template>
  <slot
    :is-hovering="isHovering"
    :hover-props="{
      onmouseenter: () => isHovering = true,
      onmouseleave: () => isHovering = false
    }" />
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';

const isHovering = shallowRef(false);
</script>
