<template>
  <footer
    class="uno-sticky uno-bottom-0 uno-z-2000"
    :style="{ marginLeft: left }"
    v-bind="getBaseProps($attrs)">
    <slot />
  </footer>
</template>

<script setup lang="ts">
/**
 * @component
 * Sticky footer: it takes its own space at the end of the page, so it never covers the main content. It must come
 * after the main content, inside a flex column where the main content grows (like the layouts' container), so it
 * also stays at the bottom of short pages.
 */
import { computed } from 'vue';
import { useLayout } from 'vuetify';
import { getBaseProps } from '#/util/props.ts';

/**
 * TODO: Remove this once Vuetify is removed
 */
const { mainStyles } = useLayout();
const left = computed(() => mainStyles.value['--v-layout-left']);
</script>
