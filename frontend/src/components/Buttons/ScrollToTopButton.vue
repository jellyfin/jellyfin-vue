<template>
  <v-fab-transition>
    <v-btn
      v-show="y > 1"
      color="primary"
      fab
      dark
      location="bottom right"
      fixed
      @click="scrollToTop">
      <Icon>
        <i-mdi-chevron-up />
      </Icon>
    </v-btn>
  </v-fab-transition>
</template>

<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core';

const { y } = useWindowScroll();

/**
 * Scrolls to the top of the page
 */
function scrollToTop(): void {
  window.scrollTo({ top: 0 });
}
</script>
