/* eslint-disable no-restricted-imports */
import { vuetify } from '@/plugins';
/* eslint-enable no-restricted-imports */

/**
 * Returns the global vuetify instance. Needed when used outside setup
 * functions or anywhere else outside the Vue app instance.
 */
export function useVuetify(): typeof vuetify {
  return vuetify;
}
