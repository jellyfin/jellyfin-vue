<template>
  <template v-if="src">
    <VFadeTransition
      group
      mode="in-out">
      <template v-if="shown">
        <component
          :is="type"
          class="j-img"
          v-bind="$attrs"
          :src="type === 'img' ? src : undefined" />
      </template>
      <template v-else>
        <slot
          v-if="$slots.placeholder"
          name="placeholder" />
        <slot
          v-else-if="loading"
          name="loading" />
        <slot
          v-else-if="error"
          name="error" />
      </template>
    </VFadeTransition>
  </template>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed, watch, shallowRef } from 'vue';

interface Props {
  src?: string | null;
  /**
   * Cover the parent area. This renders the component as a div
   */
  cover?: boolean;
}

const props = defineProps<Props>();

const loading = shallowRef(true);
const error = shallowRef(false);

const url = computed(() => `url('${props.src}'')`);
const type = computed(() => props.cover ? 'div' : 'img');
const shown = computed(() => !loading.value && !error.value);

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
.j-img {
  width: 100%;
  height: 100%;
}

div.j-img {
  background-image: v-bind(url);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}
</style>
