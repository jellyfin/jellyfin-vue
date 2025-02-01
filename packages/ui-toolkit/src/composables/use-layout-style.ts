import { inject, onScopeDispose, ref, toValue, type MaybeRefOrGetter, type Ref, type StyleValue } from 'vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import { watchImmediate } from '@vueuse/core';
import { JMain_style } from '#/store/keys';

/**
 * Modifies the style of the main div component
 */
export function useLayoutStyle(new_style: MaybeRefOrGetter<StyleValue>) {
  const injected_style = inject(JMain_style);
  const styles: Ref<StyleValue[]> = ref([]);

  if (isNil(injected_style)) {
    return;
  }

  injected_style.value.push(styles.value);

  watchImmediate(() => toValue(new_style), (value) => {
    styles.value.length = 0;
    styles.value.push(value);
  });

  onScopeDispose(() => injected_style.value.splice(injected_style.value.indexOf(styles.value), 1));
}
