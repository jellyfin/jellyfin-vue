<template>
  <span v-bind="getBaseProps($attrs)" />
</template>

<script setup lang="ts">
import { getBaseProps } from '#/util/props';
</script>
