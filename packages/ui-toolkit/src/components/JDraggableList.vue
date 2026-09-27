<template>
  <component
    :is="tag"
    ref="container">
    <template
      v-for="(item, index) of items"
      :key="getItemKey(item, index)">
      <slot
        :item="item"
        :index="index" />
    </template>
  </component>
</template>

<script setup lang="ts" generic="T">
import Sortable from 'sortablejs';
import { onScopeDispose, useTemplateRef, watch } from 'vue';
import { isNumber } from '@jellyfin-vue/shared/validation';

const {
  tag = 'span',
  options,
  itemKey,
  items
} = defineProps<{
  items: readonly T[];
  itemKey: (item: T, index: number) => string | number;
  tag?: string;
  options?: Sortable.Options;
}>();

const emit = defineEmits<{
  reorder: [event: { item: T; oldIndex: number; newIndex: number }];
}>();

let sortable: Sortable | undefined;
const container = useTemplateRef<HTMLElement>('container');

/**
 * Get a stable key for a rendered item.
 */
function getItemKey(item: T, index: number): string | number {
  return itemKey(item, index);
}

/**
 * Destroy the Sortable instance.
 */
function destroy(): void {
  sortable?.destroy();
  sortable = undefined;
}

watch(
  container,
  () => {
    destroy();

    if (!container.value) {
      return;
    }

    sortable = new Sortable(container.value, {
      animation: 500,
      delay: 0,
      dragoverBubble: true,
      ...options,
      onUpdate(event): void {
        options?.onUpdate?.(event);

        if (isNumber(event.oldIndex) && isNumber(event.newIndex)) {
          const item = items[event.oldIndex];

          if (!item) {
            return;
          }

          emit('reorder', {
            item,
            oldIndex: event.oldIndex,
            newIndex: event.newIndex
          });
        }
      }
    });
  },
  { immediate: true }
);

onScopeDispose(destroy);
</script>
