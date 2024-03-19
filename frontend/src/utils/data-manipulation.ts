import defu from 'defu';

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
    (key) => !defaultKeys.has(key)
  );

  defu(object, defaultObject);

  for (const key of missingKeys) {
    delete object[key];
  }

  return object;
}
