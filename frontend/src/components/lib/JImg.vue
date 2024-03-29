<template>
  <template v-if="src">
    <link
      v-if="!shown"
      rel="preload prerender"
      as="image"
      :href="src"
      :style="undefined"
      @load="onLoad"
      @error="onError" />
    <VFadeTransition
      group
      mode="in-out">
      <component
        :is="type"
        v-show="shown"
        key="1"
        class="j-img"
        v-bind="$attrs"
        :src="type === 'img' ? src : undefined">
        <slot />
      </component>
      <template v-if="!shown">
        <slot
          v-if="$slots.placeholder"
          key="2"
          v-bind="$attrs"
          name="placeholder" />
        <slot
          v-else-if="loading"
          key="3"
          v-bind="$attrs"
          name="loading" />
        <slot
          v-else-if="error"
          key="4"
          v-bind="$attrs"
          name="error" />
      </template>
    </VFadeTransition>
  </template>
  <slot
    v-else-if="$slots.placeholder"
    v-bind="$attrs"
    name="placeholder" />
  <slot
    v-else
    v-bind="$attrs" />
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';

/**
 * In this component, we use a link element for image preload.
 * The link element is the browser standard for resource prefetching and we can use it everytime, regardless if the component is a div or an img.
 *
 * Given the img at loading is v-show'ed to false (display: none), the load events doesn't trigger either
 */

interface Props {
  src?: string | null;
  /**
   * Cover the parent area. This renders the component as a div
   */
  cover?: boolean;
  /**
   * If this is true, the image won't follow the load procedures after a src change and the image will simply be
   * updated in place without showing any of the slots.
   */
  once?: boolean;
}

const props = defineProps<Props>();

const loading = shallowRef(true);
const error = shallowRef(false);

const url = computed(() => `url('${props.src}'')`);
const type = computed(() => props.cover ? 'div' : 'img');
const shown = computed(() => !loading.value && !error.value);

/**
 * Event handler for the loadstart event
 */
function onLoadStart(): void {
  if (!props.once) {
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

watch(() => props.src, onLoadStart);
</script>

<style scoped>
.j-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

div.j-img {
  background-image: v-bind(url);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}
</style>
