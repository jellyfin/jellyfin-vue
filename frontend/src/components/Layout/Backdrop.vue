<template>
  <JTransition>
    <div
      v-if="blurhash"
      :key="`backdrop-${blurhash}`"
      class="backdrop sizing"
      :style="{
        opacity,
      }">
      <BlurhashCanvas
        :hash="blurhash"
        :width="32"
        :height="32"
        class="sizing" />
    </div>
  </JTransition>
</template>

<script lang="ts">
import { toRef, type MaybeRefOrGetter, shallowRef, onMounted, onBeforeUnmount } from 'vue';
import { watchImmediate } from '@vueuse/core';
import { isNil } from '@/utils/validation';

const DEFAULT_OPACITY = 0.25;
const _blurhash = shallowRef<string>();
const _opacity = shallowRef(DEFAULT_OPACITY);

/**
 * Reactively sets the backdrop properties. Can be used in 2 ways:
 *
 * 1. Providing raw/reactive/ref/getters arguments that will be tracked for changes by the composable.
 * 2. Accessing the returned refs and setting them manually.
 *
 * Values will be set to default (undefined for hash and 0.25 for opacity) when the component consuming this composable is unmounted.
 */
export function useBackdrop(hash?: MaybeRefOrGetter<string | undefined>, opacity?: MaybeRefOrGetter<number | undefined>) {
  onMounted(() => {
    if (!isNil(hash)) {
      watchImmediate(toRef(hash), val => _blurhash.value = val);
    }

    if (!isNil(opacity)) {
      watchImmediate(toRef(opacity), val => _opacity.value = val ?? DEFAULT_OPACITY);
    }
  });

  onBeforeUnmount(() => _blurhash.value = undefined);
  onBeforeUnmount(() => _opacity.value = DEFAULT_OPACITY);

  return { backdrop: _blurhash, opacity: _opacity.value };
}
</script>

<script setup lang="ts">
const blurhash = _blurhash;
const opacity = _opacity;
</script>

<style scoped>
.backdrop {
  background-color: rgb(var(--v-theme-background));
}

.sizing {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-size: cover;
}
</style>
