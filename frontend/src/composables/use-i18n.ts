/* eslint-disable no-restricted-imports */
import i18n from '@/plugins/vue/i18n';
/* eslint-enable no-restricted-imports */

/**
 * Returns the Vue i18n instance. Needed when used outside setup
 */
export function usei18n(): typeof i18n.global {
  return i18n.global;
}
