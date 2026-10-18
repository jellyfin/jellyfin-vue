<template>
  <slot />
</template>

<script setup lang="ts">
import { useScrollRestoration } from 'vue-router/experimental';

useScrollRestoration();
</script>
