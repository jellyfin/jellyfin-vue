<template>
  <span v-bind="getBaseProps($attrs)">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { getBaseProps } from '#/util/props';
</script>
