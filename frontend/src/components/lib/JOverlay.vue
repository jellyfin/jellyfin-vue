<template>
  <span
    v-bind="$attrs"
    aria-hidden
    class="uno-fixed uno-inset-0 uno-z-100"
    :class="[{
      'uno-opacity-0 uno-transition-opacity': scrim,
      'media-mouse:uno-bg-background media-mouse:uno-bg-opacity-50': !override && scrim
    }, ...(override ? override : [])]"
    @pointerenter="model = true"
    @pointerleave="model = false">
    <slot />
  </span>
</template>

<script setup lang="ts">
/**
 * @component - JOverlay
 * This component is used to create an overlay over the parent div.
 * By default, it will just provide a wrapper for rendering content over it.
 * If you want to darken on hover, please use the `scrim` prop.
 * By default, the theme's background color will be used, but if you pass
 * custom classes, yours will override the this.
 */

// TODO: Extract transition duration to a global variable in UnoCSS preset

const { scrim } = defineProps<{
  /**
   * Whether to darken the overlay on hover
   */
  scrim?: boolean;
  /**
   * Classes to override the scrim CSS
   */
  override?: string;
}>();
const model = defineModel<boolean>({ default: false });
</script>
