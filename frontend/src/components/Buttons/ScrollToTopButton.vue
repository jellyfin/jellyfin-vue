<template>
  <VFabTransition>
    <VBtn
      v-show="y > 1"
      class="ma-4"
      color="primary"
      icon
      location="bottom right"
      position="fixed"
      variant="elevated"
      @click="scrollToTop">
      <VIcon>
        <IMdiChevronUp />
      </VIcon>
    </VBtn>
  </VFabTransition>
</template>

<script setup lang="ts">
import { windowScroll } from '@/store';

const { y } = windowScroll;

/**
 * Scrolls to the top of the page
 */
function scrollToTop(): void {
  window.scrollTo({ top: 0 });
}
</script>
