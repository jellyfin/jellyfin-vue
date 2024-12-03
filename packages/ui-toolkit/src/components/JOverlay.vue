<template>
  <div
    class="uno-absolute uno-top-0 uno-left-0 uno-inset-0 uno-z-50 uno-transition-opacity"
    :class="{
      'uno-opacity-0 hover:media-mouse:uno-opacity-100': hover,
      'uno-opacity-100': !hover,
      'uno-bg-background uno-bg-opacity-50': scrim,
      'uno-bg-opacity-0 uno-opacity-0 hover:media-mouse:uno-opacity-100 hover:media-mouse:uno-bg-opacity-50': hover && scrim
    }"
    v-bind="getBaseProps($attrs)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { getBaseProps } from '#/util/props';
/**
 * @component - JOverlay
 * This component is used to create an overlay over the parent div.
 * By default, it will just provide a wrapper for rendering content over it.
 */

const { hover, scrim } = defineProps<{
  /**
   * Whether to show the contents only on hover
   */
  hover?: boolean;
  /**
   * Whether the overlay has a scrim effect. You can override the opacity level
   * by passing a custom uno-bg-opacity-* class.
   */
  scrim?: boolean;
}>();
</script>
