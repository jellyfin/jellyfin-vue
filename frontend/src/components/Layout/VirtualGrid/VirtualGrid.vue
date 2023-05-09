<template>
  <component
    :is="tag"
    v-show="items.length > 0"
    ref="rootRef"
    :style="rootStyles">
    <component
      :is="probeTag"
      ref="probeRef"
      :style="{
        opacity: 0,
        visibility: 'hidden',
        gridArea: '1/1',
        pointerEvents: 'none',
        zIndex: -1,
        placeSelf: 'stretch'
      }">
      <slot :item="items[0]" :index="0" :style="undefined" />
    </component>
    <template v-if="visibleItems && visibleItems.length > 0">
      <slot
        v-for="(_n, i) in visibleItems.length"
        :key="visibleItems[i].index"
        :item="visibleItems[i].value"
        :index="visibleItems[i].index"
        :style="visibleItems[i].style"
        data-virtualized-grid />
    </template>
  </component>
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
 * - Types for BaseItemDto
 * - Improved documentation and comments
 */
import {
  shallowRef,
  ref,
  watch,
  StyleValue,
  onMounted,
  onUnmounted,
  computed
} from 'vue';
import {
  Fn,
  refDebounced,
  useEventListener,
  useResizeObserver,
  useThrottleFn
} from '@vueuse/core';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { isNil } from 'lodash-es';
import {
  fromScrollParent,
  getBufferMeta,
  getContentSize,
  getResizeMeasurement,
  getVisibleItems,
  SpaceAroundWindow
} from './pipeline';
import { useVuetify } from '@/composables';

/**
 * SHARED STATE ACROSS ALL THE COMPONENT INSTANCES
 */
const display = useVuetify().display;
const displayWidth = refDebounced(display.width, 250);
const displayHeight = refDebounced(display.height, 250);
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    items: BaseItemDto[];
    tag?: string;
    probeTag?: string;
    bufferMultiplier?: number;
    /**
     * Amount of time to throttle scroll events
     */
    throttleScroll?: number;
  }>(),
  {
    tag: 'div',
    probeTag: 'div',
    bufferMultiplier: 1,
    throttleScroll: 250
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
const itemRect = ref<DOMRectReadOnly>();
const scrollEvents = shallowRef(0);
const eventCleanups: Fn[] = [];

/**
 * == MEASUREMENTS OF THE GRID AREA AND STYLING ==
 * In the if check of each computed property we add all the objects that we want
 * Vue to track.
 */
const resizeMeasurement = computed(() => {
  return rootRef.value &&
    itemRect.value &&
    displayWidth.value !== undefined &&
    displayHeight.value !== undefined
    ? getResizeMeasurement(rootRef.value, itemRect.value)
    : undefined;
});
const contentSize = computed(() => {
  return resizeMeasurement.value &&
    displayWidth.value !== undefined &&
    displayHeight.value !== undefined
    ? getContentSize(resizeMeasurement.value, props.items.length)
    : undefined;
});
const rootStyles = computed<StyleValue>(() =>
  Object.fromEntries([
    ...Object.entries(contentSize.value || {}).map(([property, value]) => [
      property,
      value + 'px'
    ]),
    ['placeContent', 'start']
  ])
);
const spaceAroundWindow = computed<SpaceAroundWindow | undefined>(() => {
  if (
    displayWidth.value !== undefined &&
    displayHeight.value !== undefined &&
    !isNil(rootRef.value) &&
    !isNil(scrollEvents.value) &&
    !isNil(props.items)
  ) {
    const { left, top } = rootRef.value.getBoundingClientRect();

    return {
      left: Math.abs(Math.min(left, 0)),
      top: Math.abs(Math.min(top, 0))
    };
  }
});
const bufferMeta = computed(() => {
  if (!isNil(spaceAroundWindow.value) && !isNil(resizeMeasurement.value)) {
    return getBufferMeta(
      spaceAroundWindow.value,
      resizeMeasurement.value,
      props.bufferMultiplier
    );
  }
});
const visibleItems = computed(() => {
  if (!isNil(bufferMeta.value) && !isNil(resizeMeasurement.value)) {
    return getVisibleItems(
      bufferMeta.value,
      resizeMeasurement.value,
      props.items
    );
  }
});

/**
 * == VIRTUAL SCROLLING LOGIC ==
 */
onMounted(() => {
  useResizeObserver(probeRef, (entries) => {
    itemRect.value = entries[0].contentRect;
  });
});

/**
 * VueUse's useEventListener automatically discards the used event listener
 * as soon as the effect scope (in this case, the current component) is discarded.
 *
 * However, since we're dynamically adding events based on the scroll parent (see watcher below),
 * we must control the cleanup of those manually when the scroll parent changes.
 *
 * As the event listener is added inside a watcher (a different effect scope),
 * we need to dispose on onUnmounted as well
 */
function destroyEventListeners(): void {
  for (const cleanup of eventCleanups) {
    cleanup();
  }
}

watch(
  [fromScrollParent(rootRef), (): number => props.throttleScroll],
  (newValue) => {
    destroyEventListeners();

    if (!isNil(newValue[0])) {
      const fn =
        props.throttleScroll > 0
          ? useThrottleFn(() => {
              scrollEvents.value++;
            }, props.throttleScroll)
          : (): void => {
              scrollEvents.value++;
            };

      for (const parent of newValue[0]) {
        const cleanup = useEventListener(parent, 'scroll', fn, {
          passive: true,
          capture: true
        });

        eventCleanups.push(cleanup);
      }
    }
  }
);

onUnmounted(() => {
  destroyEventListeners();
});
</script>
