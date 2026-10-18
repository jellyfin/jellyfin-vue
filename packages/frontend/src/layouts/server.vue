<template>
  <LoadingIndicator />
  <JMain class="uno-h-full">
    <slot />
  </JMain>
  <JFooter class="uno-pa-2">
    <LocaleSwitcher elevated />
  </JFooter>
</template>

<script setup lang="ts">
import { useScrollRestoration } from 'vue-router/experimental';

useScrollRestoration();
</script>
