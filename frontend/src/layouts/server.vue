<template>
  <LoadingIndicator />
  <VMain class="uno-h-full">
    <slot />
  </VMain>
  <VFooter
    app
    color="transparent">
    <LocaleSwitcher
      top
      elevated />
  </VFooter>
</template>

<script setup lang="ts">
</script>
