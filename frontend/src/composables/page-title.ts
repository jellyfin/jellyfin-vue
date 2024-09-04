import { computed, onBeforeUnmount, onMounted, shallowRef, toRef, toValue, type MaybeRefOrGetter } from 'vue';
import { useTitle as _useTitle, watchImmediate } from '@vueuse/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { isNil } from '@/utils/validation';

/**
 * This composable handles the page title of the application.
 */
const DEFAULT_PAGE_TITLE = 'Jellyfin Vue';
const _title = shallowRef<string>();
const _fullTitle = computed(() => _title.value ? `${_title.value.trim()} | ${DEFAULT_PAGE_TITLE}` : DEFAULT_PAGE_TITLE);

_useTitle(_fullTitle);

/**
 * Reactively sets the page title with the following template: **`title` | Jellyfin Vue**. Can be used in 2 ways:
 *
 * 1. Providing raw/reactive/ref/getter argument that will be tracked for changes by the composable. Raw values
 * can't be tracked directly, so they need to be wrapped in a ref or getter.
 * 2. Accessing the returned ref and setting it manually.
 *
 * Value will be set to default (undefined) when the component consuming this composable is unmounted.
 */
export function usePageTitle(title?: MaybeRefOrGetter<Nullish<string>>) {
  onMounted(() => {
    if (!isNil(title)) {
      watchImmediate(toRef(title), val => _title.value = val ?? undefined);
    }
  });

  onBeforeUnmount(() => _title.value = undefined);

  return { title: _title };
};

/**
 * Same as useTitle, but is a shorthand for items only.
 */
export function useItemPageTitle(item: MaybeRefOrGetter<Nullish<BaseItemDto>>) {
  usePageTitle(() => toValue(item)?.Name);
};
