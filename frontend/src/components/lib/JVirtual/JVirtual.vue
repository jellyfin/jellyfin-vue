<template>
  <Component
    :is="tag"
    ref="rootRef"
    class="uno-will-change-contents"
    :style="rootStyles">
    <Component
      :is="probeTag"
      ref="probeRef"
      class="uno-pointer-events-none uno-invisible uno-z--1 uno-place-self-stretch uno-opacity-0"
      :class="gridClass">
      <slot :item="items[0]" />
    </Component>
    <template v-if="visibleItems.length">
      <JSlot
        v-for="internal_item in visibleItems"
        :key="indexAsKey ? internal_item.index : undefined"
        :class="gridClass"
        :style="internal_item.style">
        <slot
          :item="items[internal_item.index]"
          :index="internal_item.index" />
      </JSlot>
    </template>
  </Component>
</template>

<script lang="ts">
import {
  refDebounced,
  useEventListener,
  useResizeObserver,
  type Fn
} from '@vueuse/core';
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  watch,
  type StyleValue,
  useTemplateRef
} from 'vue';
import { wrap } from 'comlink';
import {
  getBufferMeta,
  getContentSize,
  getResizeMeasurement,
  getScrollParents,
  getScrollToInfo,
  type InternalItem
} from './pipeline';
import type { IJVirtualWorker } from './j-virtual.worker';
import JVirtualWorker from './j-virtual.worker?worker';
import { vuetify } from '@/plugins/vuetify';
import { isNil, isUndef } from '@/utils/validation';

/**
 * SHARED STATE ACROSS ALL THE COMPONENT INSTANCES
 */
const display = vuetify.display;
const displayWidth = refDebounced(display.width, 250);
const displayHeight = refDebounced(display.height, 250);
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
const { items, tag = 'div', probeTag = 'div', bufferMultiplier = 1.2, scrollTo, grid, indexAsKey } = defineProps<{
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
   * Item index to scroll to. It just scrolls to the item, it doesn't lock screen to it.
   */
  scrollTo?: number;
  /**
   * Whether to use a grid layout
   */
  grid?: boolean;
  /**
   * Updates the content by using the index as key. This is useful in case the inner content
   * doesn't react properly to changes in the data.
   */
  indexAsKey?: boolean;
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
const workerUpdates = shallowRef(0);

/**
 * == NON REACTIVE STATE ==
 */
const eventCleanups: Fn[] = [];
const workerInstance = new JVirtualWorker();
const worker = wrap<IJVirtualWorker>(workerInstance);
const cache = new Map<number, InternalItem[]>();

/**
 * == MEASUREMENTS OF THE GRID AREA AND STYLING ==
 * In the if check of each computed property we add all the objects that we want
 * Vue to track for changes. If we don't do this, Vue will not track the dependencies
 * correctly.
 */
const gridClass = computed(() => grid ? 'j-virtual-grid-area' : undefined);
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
  ...(contentSize.value?.height && { height: `${contentSize.value.height}px` }),
  ...(contentSize.value?.width && { width: `${contentSize.value.width}px` }),
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
  if (Number.isFinite(workerUpdates.value) && Number.isFinite(scrollEvents.value)) {
    const elems = cache.get(bufferOffset.value) ?? [];

    return elems.length ? elems : previous ?? [];
  }

  return [];
});
const scrollParents = computed(() => rootRef.value && getScrollParents(rootRef.value));
const scrollTargets = computed(() => {
  const el = rootRef.value;

  if (el && el instanceof HTMLElement) {
    const { vertical, horizontal } = getScrollParents(el);

    /**
     * If the scrolling parent is the doc root, use window instead as using
     * document root might not work properly.
     */
    return (
      vertical === horizontal ? [vertical] : [vertical, horizontal]
    ).map(parent =>
      (parent === document.documentElement ? window : parent)
    );
  }
});

/**
 * == VIRTUAL SCROLLING LOGIC ==
 */
useResizeObserver(probeRef, (entries) => {
  itemRect.value = entries[0].contentRect;
});

/**
 * VueUse's useEventListener automatically discards the used event listener
 * as soon as the effect scope (in this case, the current component) is discarded.
 *
 * However, since we're dynamically adding events based on the scroll parent (see watcher below),
 * we must control the cleanup of those manually when the scroll parent changes.
 *
 * As the event listener is added inside a watcher (a different effect scope),
 * we need to dispose on onBeforeUnmount as well
 */
function destroyEventListeners(): void {
  for (const cleanup of eventCleanups) {
    cleanup();
  }
}

/**
 * Sets the cache
 * ONLY USE INSIDE populateCache, since nullish checks are skipped here
 */
async function setCache(offset: number): Promise<void> {
  /**
   * Set the cache value rightaway to an empty value.
   * That way, populateCache loop doesn't fire again
   * with the same offset before this promise resolves.
   */
  cache.set(offset, []);

  const values = await worker.getVisibleIndexes(
    { bufferedLength: bufferLength.value, bufferedOffset: offset },
    resizeMeasurement.value!,
    itemsLength.value
  );

  /**
   * If the WebWorker operation was running in the middle of a cache clear,
   * old data might be pushed instead, so we avoid it here.
   */
  window.requestAnimationFrame(() => {
    if (cache.size !== 0) {
      cache.set(offset, values);
      workerUpdates.value++;
    }
  });
}

/**
 * Handles all the logic for caching the virtual scrolling items and
 * the interaction with the worker.
 *
 * We cache the items to avoid the extra overhead of sending the items
 * to the worker when scrolling fast. We cache 2 times the buffer length
 */
function populateCache(): void {
  if (!isUndef(resizeMeasurement.value)
    && Number.isFinite(bufferLength.value)
    && Number.isFinite(bufferOffset.value)
  ) {
    const area = bufferLength.value * 2;
    const start = Math.max(1, bufferOffset.value - area);
    const finish = bufferOffset.value + area;

    /**
     * We always populate 0 first, so there's no blank space shown at the beginning
     * or when scrolling to top after a resize in the bottom area.
     */
    if (!cache.has(0)) {
      void setCache(0);
    }

    for (let i = finish; i >= start && !cache.has(i); i--) {
      /**
       * Fire all the operations concurrently, no need to await them
       */
      void setCache(i);
    }
  }
}

/**
 * Gets the appropiate DOM element for listening to scroll events
 */
watch(
  scrollTargets,
  () => {
    destroyEventListeners();

    if (!isUndef(scrollTargets.value)) {
      for (const parent of scrollTargets.value) {
        const cleanup = useEventListener(parent, 'scroll', () => {
          window.requestAnimationFrame(() => scrollEvents.value++);
        }, {
          passive: true,
          capture: true
        });

        eventCleanups.push(cleanup);
      }
    }
  }
);

/**
 * Tracks if the scroll must be pointed at an specific element
 */
watch(() => scrollTo, () => {
  if (!isUndef(rootRef.value)
    && !isUndef(scrollTo)
    && !isUndef(resizeMeasurement.value)
    && !isUndef(scrollParents.value)
    && scrollTo > 0
    && scrollTo < itemsLength.value) {
    const { target, top, left } = getScrollToInfo(scrollParents.value, rootRef.value, resizeMeasurement.value, scrollTo);

    target.scrollTo({ top, left, behavior: 'smooth' });
  }
});

/**
 * Populate and reset the cache according to the current buffer state
 */
watch([bufferLength, resizeMeasurement, itemsLength, bufferOffset], (val, oldVal) => {
  if (val[0] !== oldVal[0] || val[1] !== oldVal[1] || val[2] !== oldVal[2]) {
    cache.clear();
  }

  populateCache();
});

onBeforeUnmount(destroyEventListeners);
onBeforeUnmount(() => workerInstance.terminate());
onBeforeUnmount(() => cache.clear());
</script>

<style scoped>
:deep(.j-virtual-grid-area) {
  grid-area: 1/1;
}
</style>
