// eslint-disable-next-line no-restricted-imports
import { vuetify } from '@/plugins';

/**
 * Returns the global vuetify instance. Needed when used outside setup
 * functions or anywhere else outside the Vue app instance.
 */
export function useVuetify(): typeof vuetify {
  return vuetify;
}
