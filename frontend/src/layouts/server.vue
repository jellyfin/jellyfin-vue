<template>
  <LoadingIndicator />
  <VMain class="h-100">
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
