<template>
  <slot
    :is-hovering="isHovering"
    :hover-props="{
      onmouseover: () => isHovering = true,
      onmouseout: () => isHovering = false
    }" />
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';

const isHovering = shallowRef(false);
</script>
