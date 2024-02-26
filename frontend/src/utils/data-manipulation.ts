import { createDefu } from 'defu';

/**
 * Merge 2 objects, excluding the keys from the destination that are not present in source
 *
 * @param object - Target object. This one contains keys that might not be present in defaults
 * @param defaultObject - Sample/default representation of the object that should be used to detect which keys
 * should/shouldn't exist in the target.
 */
export const defuSchema = createDefu((schema, key) => {
  return !(key in schema);
});
