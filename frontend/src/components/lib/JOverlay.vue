<template>
  <JTransition>
    <span
      v-bind="$attrs"
      aria-hidden
      class="uno-fixed uno-inset-0 uno-z-100"
      :class="{ 'scrim': scrim }">
      <slot />
    </span>
  </JTransition>
</template>

<script setup lang="ts">
const { scrim } = defineProps<{ scrim?: boolean }>();
</script>

<style scoped>
.scrim {
  background: rgba(var(--j-color-background), 0.75);
}
</style>
