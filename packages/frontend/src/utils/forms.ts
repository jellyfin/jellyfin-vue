/**
 * Helper for form related functions
 *
 */
import { computed, type WritableComputedRef } from 'vue';

export interface VSelectItem<T> {
  value: T;
}

/**
 * Returns a suitable list for use with the 'item' prop for v-select
 *
 * @param values - list of values to use for the v-select
 * @returns list ready to be used in the :item property of a v-select
 */
export function getItemizedSelect<T>(values: T[]): VSelectItem<T>[] {
  return values.map((value) => {
    return { value };
  });
}

/**
 * Binds a value to a Vuetify selection control (switch, radio group), whose events may carry null when the
 * control has no value. A null never replaces the value.
 *
 * @param model - The value to bind, such as a store's ref
 */
export function selectionModel<T>(model: { value: T }): WritableComputedRef<T, T | null> {
  return computed<T, T | null>({
    get: () => model.value,
    set: (value) => {
      if (value !== null) {
        model.value = value;
      }
    }
  });
}
