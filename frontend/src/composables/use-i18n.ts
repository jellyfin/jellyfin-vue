/* eslint-disable no-restricted-imports */
import i18n from '@/plugins/i18n';
/* eslint-enable no-restricted-imports */

/**
 * Returns the global vue-i18n instance. Needed when used outside setup
 * functions or anywhere else outside the Vue app instance.
 */
export function usei18n(): typeof i18n.global {
  return i18n.global;
}
