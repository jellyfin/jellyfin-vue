<template>
  <footer
    ref="footerRef"
    class="uno-fixed uno-bottom-0 uno-z-2000"
    :style="{
      left,
      width: `calc(100% - ${left})`,
    }"
    v-bind="getBaseProps($attrs)">
    <slot />
  </footer>
</template>

<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core';
import { computed, shallowRef, useTemplateRef } from 'vue';
import { useLayout } from 'vuetify';
import { getBaseProps } from '#/util/props';
import { useLayoutStyle } from '#/composables/use-layout-style';
import { toPx } from '#/util/helpers';

const el = useTemplateRef('footerRef');
const height = shallowRef('0');

useResizeObserver(el, (entries) => {
  globalThis.setTimeout(() => {
    const entry = entries[0];

    height.value = toPx(entry!.contentRect.height);
  });
});

useLayoutStyle(() => ({ 'padding-bottom': height.value }));

/**
 * TODO: Remove this once Vuetify is removed. This component currently causes overflow in login pages
 */
const { mainStyles } = useLayout();
const left = computed(() => mainStyles.value['--v-layout-left']);
</script>
