<template>
  <Component
    :is="tag"
    v-show="items.length"
    ref="rootRef"
    :style="rootStyles">
    <Component
      :is="probeTag"
      ref="probeRef"
      class="uno-invisible uno-pointer-events-none uno-place-self-stretch uno-opacity-0"
      :style="{
        gridArea: '1/1',
        zIndex: -1
      }">
      <slot
        :item="items[0]"
        :index="0" />
    </Component>
    <template v-if="visibleItems && visibleItems.length">
      <JSlot v-for="(_n, i) in visibleItems.length"
        :key="visibleItems[i].index"
        :style="visibleItems[i].style">
        <slot
          :item="visibleItems[i].value"
          :index="visibleItems[i].index"/>
      </JSlot>
    </template>
  </Component>
</template>

<script lang="ts">
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
  type StyleValue
} from 'vue';
import {
  fromScrollParent,
  getBufferMeta,
  getContentSize,
  getResizeMeasurement,
  getVisibleItems
} from './pipeline';
import { isNil } from '@/utils/validation';
import { vuetify } from '@/plugins/vuetify';

/**
 * SHARED STATE ACROSS ALL THE COMPONENT INSTANCES
 */
const display = vuetify.display;
const displayWidth = refDebounced(display.width, 250);
const displayHeight = refDebounced(display.height, 250);
</script>

<script setup lang="ts" generic="T">
const props = withDefaults(
  defineProps<{
    items: T[];
    tag?: string;
    probeTag?: string;
    bufferMultiplier?: number;
  }>(),
  {
    tag: 'div',
    probeTag: 'div',
    bufferMultiplier: 1
  }
);

/**
 * == TEMPLATE REFS ==
 */
const rootRef = shallowRef<HTMLElement>();
const probeRef = shallowRef<HTMLElement>();

/**
 * == STATE REFS ==
 */
const itemRect = shallowRef<DOMRectReadOnly>();
const scrollEvents = shallowRef(0);
const eventCleanups: Fn[] = [];

/**
 * == MEASUREMENTS OF THE GRID AREA AND STYLING ==
 * In the if check of each computed property we add all the objects that we want
 * Vue to track.
 */
const resizeMeasurement = computed(() => {
  return rootRef.value
    && itemRect.value
    && displayWidth.value !== undefined
    && displayHeight.value !== undefined
    && !isNil(props.items)
    ? getResizeMeasurement(rootRef.value, itemRect.value)
    : undefined;
});
const contentSize = computed(() => {
  return resizeMeasurement.value
    && displayWidth.value !== undefined
    && displayHeight.value !== undefined
    && !isNil(props.items)
    ? getContentSize(resizeMeasurement.value, props.items.length)
    : undefined;
});
const rootStyles = computed<StyleValue>(() => {
  return {
    ...(contentSize.value?.height && { height: `${contentSize.value.height}px` }),
    ...(contentSize.value?.width && { width: `${contentSize.value.width}px` }),
    placeContent: 'start'
  };
});
/**
 * Cache internal properties instead of passing them as objects, as using the objects directly will lead to firing the computed properties' effects
 * even if they haven't changed (since returning a object is always a new object and there's no proper way in Javascript to compare objects).
 */
const boundingClientRect = computed(() => {
  if (
    displayWidth.value !== undefined
    && displayHeight.value !== undefined
    && !isNil(rootRef.value)
    && !isNil(scrollEvents.value)
    && !isNil(props.items)
  ) {
    return rootRef.value.getBoundingClientRect();
  }
});
const leftSpaceAroundWindow = computed(() => Math.abs(Math.min(boundingClientRect.value?.left ?? 0, 0)));
const topSpaceAroundWindow = computed(() => Math.abs(Math.min(boundingClientRect.value?.top ?? 0, 0)));
const bufferMeta = computed(() => {
  if (!isNil(leftSpaceAroundWindow.value) && !isNil(topSpaceAroundWindow.value) && !isNil(resizeMeasurement.value)) {
    return getBufferMeta(
      {
        left: leftSpaceAroundWindow.value,
        top: topSpaceAroundWindow.value
      },
      resizeMeasurement.value,
      props.bufferMultiplier
    );
  }
});
const bufferLength = computed(() => bufferMeta.value?.bufferedLength);
const bufferOffset = computed(() => bufferMeta.value?.bufferedOffset);
const visibleItems = computed(() => {
  if (!isNil(bufferLength.value) && !isNil(bufferOffset.value) && !isNil(resizeMeasurement.value)) {
    return getVisibleItems(
      { bufferedLength: bufferLength.value, bufferedOffset: bufferOffset.value },
      resizeMeasurement.value,
      props.items
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

const scrollParents = fromScrollParent(rootRef);

watch(
  scrollParents,
  () => {
    destroyEventListeners();

    if (!isNil(scrollParents.value)) {
      for (const parent of scrollParents.value) {
        const cleanup = useEventListener(parent, 'scroll', () => scrollEvents.value++, {
          passive: true,
          capture: true
        });

        eventCleanups.push(cleanup);
      }
    }
  }
);

onBeforeUnmount(destroyEventListeners);
</script>
