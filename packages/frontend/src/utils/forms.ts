/**
 * Helper for form related functions
 *
 */

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
