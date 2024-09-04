<template>
  <template v-if="src">
    <link
      v-if="!shown"
      rel="preload"
      as="image"
      :href="src"
      @load="onLoad"
      @error="onError">
    <JTransition
      v-bind="isObj(transitionProps) ? transitionProps : undefined"
      :disabled="!transitionProps">
      <img
        v-if="shown"
        :src="src"
        :alt="alt"
        class="j-img"
        loading="eager"
        decoding="async"
        v-bind="$attrs">
      <template v-else>
        <slot
          v-if="$slots.placeholder"
          name="placeholder" />
        <slot
          v-else-if="loading"
          name="loading">
          <VProgressCircular indeterminate />
        </slot>
        <slot
          v-else-if="error"
          name="error">
          <VIcon>
            <IMdiImageBrokenVariant />
          </VIcon>
        </slot>
      </template>
    </JTransition>
  </template>
  <slot
    v-else-if="$slots.placeholder"
    name="placeholder" />
  <slot v-else />
</template>

<script setup lang="ts">
/**
 * @component
 * In this component, we use a link element for image preload.
 * The link element is the browser standard for resource prefetching and we can use it everytime, regardless the
 * underlying element type being used.
 *
 * Given the img at loading is v-show'ed to false (display: none), the load events doesn't trigger either
 */
import { computed, shallowRef, watch } from 'vue';
import { isObj } from '@/utils/validation';
import JTransition, { type JTransitionProps } from '@/components/lib/JTransition.vue';

/**
 * We don't want <link> to inherit any attributes and the component might not render any
 * element at all, printing unnecessary warnings in development.
 */
defineOptions({
  inheritAttrs: false
});

const { src, alt, once, transitionProps = true } = defineProps<{
  src?: string;
  alt: string;
  /**
   * If this is true, the image won't follow the load procedures after a src change and the image will simply be
   * updated in place without showing any of the slots.
   */
  once?: boolean;
  /**
   * Transition between the non-default slot and the image. Uses JTransition with its
   * default values (which you can override by passing this prop). If passed false, disables de transition completely.
   *
   * @default true
   */
  transitionProps?: JTransitionProps | boolean;
}>();

const loading = shallowRef(true);
const error = shallowRef(false);
const shown = computed(() => !loading.value && !error.value);

/**
 * Event handler for the loadstart event
 */
function onLoadStart(): void {
  if (!once) {
    loading.value = true;
  }
}

/**
 * Event handler for the load event
 */
function onLoad(): void {
  loading.value = false;
  error.value = false;
}

/**
 * Event handler for the error event
 */
function onError(): void {
  loading.value = false;
  error.value = true;
}

watch(() => src, onLoadStart);
</script>

<style scoped>
.j-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
