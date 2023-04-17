import { computed, ComputedRef } from 'vue';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - The types of this module are not available since they're dynamic at build time (see vite.config.ts)
// It's not like we need strict type checking for this either given the way we invoke date-fns
import * as datefnslocales from 'virtual:date-fns/locales';
import { usei18n } from './use-i18n';

/**
 * Use any date fns function with proper localization, based on the current locale.
 * Pass the date-fns function to invoke as the first parameter,
 * and it's parameters as the second parameter
 *
 * @param func - date-fns function to invoke
 * @param params - Parameters to pass to the date-fns function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDateFns<T extends (...a: any[]) => any>(
  func: T,
  ...params: Parameters<T>
): ComputedRef<ReturnType<T>> {
  return computed(() => {
    const i18n = usei18n();
    /**
     * We need to remove the hyphen of our locale codes, as using named exports with them is not valid JS syntax
     */
    const importCode = i18n.locale.value.replace('-', '');

    if (typeof params[params.length - 1] === 'object') {
      params[params.length - 1].locale = datefnslocales[importCode];
    } else {
      params.push({ locale: datefnslocales[importCode] });
    }

    return func(...params);
  });
}
