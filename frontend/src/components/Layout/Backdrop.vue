<template>
  <JTransition>
    <BlurhashCanvas
      v-if="blurhash"
      :key="blurhash"
      :hash="blurhash"
      :width="32"
      :height="32"
      :style="{
        opacity,
      }"
      class="uno-fixed uno-h-screen uno-w-screen uno-transition-opacity" />
  </JTransition>
</template>

<script lang="ts">
import { toRef, type MaybeRefOrGetter, shallowRef, onMounted, computed, onScopeDispose } from 'vue';
import { watchImmediate } from '@vueuse/core';
import { isNil } from '@jellyfin-vue/shared/validation';
import { prefersNoTransparency } from '#/store';

const DEFAULT_OPACITY = 0.25;
const requested_opacity = shallowRef(DEFAULT_OPACITY);
const _blurhash = shallowRef<string>();
const _opacity = computed(() => prefersNoTransparency.value ? 0 : requested_opacity.value);

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
      watchImmediate(toRef(opacity), val => requested_opacity.value = val ?? DEFAULT_OPACITY);
    }
  });

  onScopeDispose(() => {
    _blurhash.value = undefined;
    requested_opacity.value = DEFAULT_OPACITY;
  });
}
</script>

<script setup lang="ts">
const blurhash = _blurhash;
const opacity = _opacity;
</script>
