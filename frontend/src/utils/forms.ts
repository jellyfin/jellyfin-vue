/**
 * Helper for form related functions
 *
 */

interface VSelectItem {
  value: unknown;
}

/**
 * Returns a suitable list for use with the 'item' prop for v-select
 *
 * @param {any[]} values - list of values to use for the v-select
 * @returns {VSelectItem[]} list ready to be used in the :item property of a v-select
 */
export function getItemizedSelect(values: unknown[]): VSelectItem[] {
  return values.map((value) => {
    return { value };
  });
}
