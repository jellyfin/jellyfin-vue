import { defu } from 'defu';

/**
 * Merge 2 objects, excluding the keys from the destination that are not present in source
 *
 * @param object - Target object. This one contains keys that might not be present in defaults
 * @param defaultObject - Sample/default representation of the object that should be used to detect which keys
 * should/shouldn't exist in the target.
 */
export function mergeExcludingUnknown<T extends object, K extends keyof T>(
  object: T,
  defaultObject: T
): T {
  const defaultKeys = new Set(Object.keys(defaultObject) as K[]);
  const missingKeys = (Object.keys(object) as K[]).filter(
    key => !defaultKeys.has(key)
  );

  object = defu(object, defaultObject);

  for (const key of missingKeys) {
    delete object[key];
  }

  return object;
}

/**
 * Uppercase the first letter of a string
 */
export function upperFirst<T extends string>(str: T): Capitalize<T> {
  return (str[0].toUpperCase() + str.slice(1)) as Capitalize<T>;
}

/**
 * Get the font faces present in the document.
 *
 * Instead of using a normal iterable (like `...[...document.fonts.keys()]`),
 * we need this for Firefox compatibility.
 *
 * See https://github.com/jellyfin/jellyfin-vue/issues/2432
 */
export function getFontFaces() {
  const iterable = document.fonts.keys();
  const results = [];
  let iterator = iterable.next();

  while (iterator.done === false) {
    results.push(iterator.value);

    iterator = iterable.next();
  }

  return results;
}
