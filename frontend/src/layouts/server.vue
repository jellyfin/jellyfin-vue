<template>
  <LoadingIndicator />
  <JMain>
    <VMain class="uno-h-full">
      <slot />
    </VMain>
  </JMain>
  <JFooter class="uno-pa-2">
    <LocaleSwitcher elevated />
  </JFooter>
</template>

<script setup lang="ts">
</script>
