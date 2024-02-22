<template>
  <template v-if="src">
    <component
      :is="type"
      v-if="!loading && !error"
      class="image"
      v-bind="$attrs"
      :src="type === 'img' ? src : undefined">
      <slot />
    </component>
    <slot
      v-else-if="loading"
      name="loading" />
    <slot
      v-else-if="error"
      name="error" />
  </template>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed, watch, shallowRef } from 'vue';

interface Props {
  type: 'div' | 'img';
  src?: string | null;
  /**
   * When used as div, enable cover sizing
   */
  cover?: boolean;
}

const props = withDefaults(defineProps<Props>(), { type: 'img' });

const loading = shallowRef(true);
const error = shallowRef(false);

const url = computed(() => `url('${props.src}'')`);
const size = computed(() => props.cover ? '100%' : 'initial');
const cover = computed(() => props.cover ? 'cover' : 'initial');

watch(() => props.src, () => {
  if (props.src) {
    const preloaderImg = new Image();

    preloaderImg.src = props.src;

    preloaderImg.addEventListener('loadstart', () => {
      preloaderImg.remove();
      loading.value = true;
    }, { once: true });
    preloaderImg.addEventListener('load', () => {
      preloaderImg.remove();
      error.value = false;
      loading.value = false;
    }, { once: true });
    preloaderImg.addEventListener('error', () => {
      preloaderImg.remove();
      loading.value = false;
      error.value = true;
    }, { once: true });
  }
}, { immediate: true });
</script>

<style scoped>
img.image {
  width: 100%;
  height: 100%;
}

div.image {
  width: v-bind(size);
  height: v-bind(size);
  background-image: v-bind(url);
  background-size: v-bind(cover);
  background-repeat: no-repeat;
  background-position: center;
}
</style>
