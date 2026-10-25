<template>
  <Component
    :is="tag"
    ref="rootRef"
    :style="rootStyles">
    <Component
      :is="probeTag"
      ref="probeRef"
      class="uno-pointer-events-none uno-invisible uno-z--1 uno-place-self-stretch"
      :class="gridClass">
      <slot
        v-if="items.length"
        :item="items[0]!" />
    </Component>
    <JSlot
      v-for="entry in renderedItems"
      :key="getKey?.(entry.item)"
      :class="gridClass"
      :style="entry.style">
      <slot
        :item="items[entry.index]!"
        :index="entry.index" />
    </JSlot>
  </Component>
</template>

<script lang="ts">
import {
  refDebounced,
  useEventListener,
  useResizeObserver
} from '@vueuse/core';
import {
  computed,
  shallowRef,
  watch,
  type StyleValue,
  useTemplateRef
} from 'vue';
import { isNil, isUndef } from '@jellyfin-vue/shared/validation';
import {
  getBufferMeta,
  getContentSize,
  getResizeMeasurement,
  getScrollParents,
  getScrollToInfo,
  getVisibleIndexes,
  type InternalItem
} from './pipeline.ts';
import { windowSize } from '#/store/index.ts';
import JSlot from '#/components/JSlot.vue';
import { toPx } from '#/util/helpers.ts';

/**
 * SHARED STATE ACROSS ALL THE COMPONENT INSTANCES
 */

const displayWidth = refDebounced(windowSize.width, 250);
const displayHeight = refDebounced(windowSize.height, 250);
</script>

<script setup lang="ts" generic="T">
/**
 * BASED ON VUE-VIRTUAL-SCROLL-GRID: https://github.com/rocwang/vue-virtual-scroll-grid
 *
 * Key differences from that module and this (some changes are going to be upstreamed so might appear in the future in the module):
 * - Improvements in the scan area (keep the offset centered to items already in view)
 * - Removed unnecessary manipulations (like the ones performed in accumulateBuffer)
 * - No ramda or Rxjs, making the bundle lighter.
 * - Full virtual scroll, no virtual + infinite scroll (as all the items are fetched from the server and we don't have pagination)
 * - Vue instance reuse
 * - No need for probe slot, default to first default slot
 * - Type support for the data that must be passed to the virtualized component's instances
 * - Improved documentation and comments
 */
const {
  items,
  tag = 'div',
  probeTag = 'div',
  bufferMultiplier = 1.2,
  scrollTo,
  grid,
  getKey
} = defineProps<{
  items: T[];
  /**
   * Element to use as a container for the virtualized elements
   * @default 'div'
   */
  tag?: string;
  /**
   * Element to use for probing the rest of the elements
   * @default 'div'
   */
  probeTag?: string;
  /**
   * Items to buffer in the view. By default, the same amount of items that fit on the screen
   * are buffered above and below the visible area.
   * @default 1
   */
  bufferMultiplier?: number;
  /**
   * Item index to scroll to. It just scrolls to the item on change, it doesn't lock screen to it.
   */
  scrollTo?: number;
  /**
   * Whether to use a grid layout
   */
  grid?: boolean;
  /**
   * Gets the key of every item. When it's passed, every rendered instance is bound to its item
   * (instances are mounted when their item enters the buffer and unmounted when it leaves it),
   * which is useful when the inner content doesn't react properly to changes in its data.
   *
   * When it's not passed, the rendered instances are reused by position: scrolling just updates
   * the data of the existing instances.
   */
  getKey?: (item: T) => unknown;
}>();

/**
 * == TEMPLATE REFS ==
 */
const rootRef = useTemplateRef<HTMLElement>('rootRef');
const probeRef = useTemplateRef<HTMLElement>('probeRef');

/**
 * == STATE REFS ==
 */
const itemRect = shallowRef<DOMRectReadOnly>();
const scrollEvents = shallowRef(0);

/**
 * == MEASUREMENTS OF THE GRID AREA AND STYLING ==
 * In the if check of each computed property we add all the objects that we want
 * Vue to track for changes. If we don't do this, Vue will not track the dependencies
 * correctly.
 */
const gridClass = computed(() => grid ? 'uno-row-start-1 uno-col-start-1' : undefined);
const itemsLength = computed(() => items.length);
const resizeMeasurement = computed(() => {
  return rootRef.value
    && itemRect.value
    && !isUndef(displayWidth.value)
    && !isUndef(displayHeight.value)
    && !isUndef(items)
    ? getResizeMeasurement(rootRef.value, itemRect.value)
    : undefined;
});
const contentSize = computed(() => {
  return resizeMeasurement.value
    && !isUndef(displayWidth.value)
    && !isUndef(displayHeight.value)
    && !isUndef(items)
    ? getContentSize(resizeMeasurement.value, itemsLength.value)
    : undefined;
});
const rootStyles = computed<StyleValue>(() => ({
  ...(!isNil(contentSize.value?.height) && { height: toPx(contentSize.value.height) }),
  ...(!isNil(contentSize.value?.width) && { width: toPx(contentSize.value.width) }),
  placeContent: 'start'
}));
  /**
   * Cache internal properties instead of passing them as objects, as using the objects directly will lead to firing the computed properties' effects
   * even if they haven't changed (since returning a object is always a new object and there's no proper way in Javascript to compare objects).
   */
const boundingClientRect = computed(() => {
  if (
    !isUndef(displayWidth.value)
    && !isUndef(displayHeight.value)
    && !isNil(rootRef.value)
    && !isUndef(scrollEvents.value)
    && !isUndef(items)
  ) {
    return rootRef.value.getBoundingClientRect();
  }
});
const leftSpaceAroundWindow = computed(() => Math.abs(Math.min(boundingClientRect.value?.left ?? 0, 0)));
const topSpaceAroundWindow = computed(() => Math.abs(Math.min(boundingClientRect.value?.top ?? 0, 0)));
const bufferMeta = computed(() => {
  if (!isUndef(resizeMeasurement.value)) {
    return getBufferMeta(
      {
        left: leftSpaceAroundWindow.value,
        top: topSpaceAroundWindow.value
      },
      resizeMeasurement.value,
      bufferMultiplier
    );
  }
});
const bufferLength = computed(() => Math.ceil(bufferMeta.value?.bufferedLength ?? 0));
const bufferOffset = computed(() => Math.ceil(bufferMeta.value?.bufferedOffset ?? 0));
const visibleItems = computed<InternalItem[]>((previous) => {
  /**
   * While the grid (or any of its ancestors) is hidden, the probe measures 0 and the buffer can't be
   * computed (with a gap, it would cover thousands of items). The current items are kept until it's shown again.
   */
  if (!itemRect.value?.width || !itemRect.value.height) {
    return previous ?? [];
  }

  if (isUndef(resizeMeasurement.value)
    || !Number.isFinite(bufferLength.value)
    || !Number.isFinite(bufferOffset.value)) {
    return [];
  }

  return getVisibleIndexes(
    { bufferedLength: bufferLength.value, bufferedOffset: bufferOffset.value },
    resizeMeasurement.value,
    itemsLength.value
  );
});
/**
 * Pairs the visible items with their data, so the template never accesses
 * indexes that don't exist anymore in the items array.
 */
const renderedItems = computed(() => {
  const result: (InternalItem & { item: T })[] = [];

  for (const { index, style } of visibleItems.value) {
    const item = items[index];

    if (!isNil(item) && style) {
      result.push({ index, style, item });
    }
  }

  return result;
});
const scrollParents = computed(() => rootRef.value && getScrollParents(rootRef.value));
const scrollTargets = computed(() => {
  if (!scrollParents.value) {
    return;
  }

  const { vertical, horizontal } = scrollParents.value;

  /**
   * If the scrolling parent is the doc root, use window instead as using
   * document root might not work properly.
   */
  return (
    vertical === horizontal ? [vertical] : [vertical, horizontal]
  ).map(parent =>
    (parent === document.documentElement ? globalThis : parent)
  );
});

/**
 * == VIRTUAL SCROLLING LOGIC ==
 */
useResizeObserver(probeRef, (entries) => {
  itemRect.value = entries[0]?.contentRect;
});

/**
 * The browser dispatches scroll events once per frame, right before the animation frame callbacks,
 * so the update is applied directly (scheduling another animation frame doesn't batch anything else)
 */
useEventListener(scrollTargets, 'scroll', () => {
  scrollEvents.value++;
}, {
  passive: true,
  capture: true
});

/**
 * Tracks if the scroll must be pointed at an specific element
 */
watch(() => scrollTo, () => {
  if (!(!isNil(rootRef.value)
    && !isUndef(scrollTo)
    && !isUndef(resizeMeasurement.value)
    && !isNil(scrollParents.value)
    && scrollTo > 0
    && scrollTo < itemsLength.value)) {
    return;
  }

  const { target, top, left } = getScrollToInfo(scrollParents.value, rootRef.value, resizeMeasurement.value, scrollTo);

  target.scrollTo({ top, left, behavior: 'smooth' });
});
</script>
