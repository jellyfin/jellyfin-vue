import { computed, ComputedRef } from 'vue';
import * as datefnslocales from 'date-fns/locale';
import { usei18n } from './use-i18n';

/**
 * Get date-fns locale based on our locale key
 */
function getDateFnsLocale(locale: string): Locale | undefined {
  //@ts-expect-error - Some of our locales are not present in datefns.
  return datefnslocales[locale];
}

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

    if (typeof params[params.length - 1] === 'object') {
      params[params.length - 1].locale = getDateFnsLocale(i18n.locale.value);
    } else {
      params.push({ locale: getDateFnsLocale(i18n.locale.value) });
    }

    return func(...params);
  });
}
