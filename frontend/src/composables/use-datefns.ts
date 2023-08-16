import { computed, ComputedRef } from 'vue';
import * as datefnslocales from 'virtual:locales/date-fns';
import { usei18n } from './use-i18n';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

/**
 * Use any date fns function with proper localization, based on the current locale.
 * Pass the date-fns function to invoke as the first parameter,
 * and it's parameters as the second parameter
 *
 * @param func - date-fns function to invoke
 * @param params - Parameters to pass to the date-fns function
 */
export function useDateFns<T extends (...a: any[]) => any>(
  func: T,
  ...params: Parameters<T>
): ComputedRef<ReturnType<T>> {
  return computed(() => {
    const i18n = usei18n();
    /**
     * We need to remove the hyphen of our locale codes, as using named exports with them is not valid JS syntax
     */
    const importCode = i18n.locale.value.replace(
      '-',
      ''
    ) as keyof typeof datefnslocales;

    if (typeof params.at(-1) === 'object') {
      params.at(-1).locale = datefnslocales[importCode];
    } else {
      params.push({ locale: datefnslocales[importCode] });
    }

    return func(...params);
  });
}

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
