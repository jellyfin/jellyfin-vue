<template>
  <LoadingIndicator />
  <VMain class="uno-h-full">
    <slot />
  </VMain>
  <VFooter
    app
    color="transparent">
    <LocaleSwitcher
      elevated
      top />
  </VFooter>
</template>

<script setup lang="ts">
</script>
