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
/**
 * TODO: Revisit this component once Vuetify is removed to update the layout/variables used
 */
import { useCssVar, useResizeObserver } from '@vueuse/core';
import { shallowRef, useTemplateRef } from 'vue';
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
const left = useCssVar('--v-layout-left', document.body.querySelector('main'), { observe: true });
</script>
