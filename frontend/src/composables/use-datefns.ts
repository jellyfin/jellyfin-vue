import { computed, ComputedRef } from 'vue';
import * as datefnslocales from 'date-fns/locale';
import { usei18n } from './use-i18n';

type keyofDateFnsLocale = keyof typeof datefnslocales;

/**
 * Get dateFns locale
 *
 * We need this due to the differences between the vue i18n and date-fns locales.
 *  1st case: when there is a date-fns locale equals to the i18n, it's all good
 *  2nd case: vue i18n got locales such as fr-FR but date-fns got them as frFR. That's to match those
 *  3rd case: if date-fns doesn't have the frFR locale, it's to check if fr exists
 * Without it, we strongly limit those matching
 */
function getDateFnsLocale(locale: string): Locale | undefined {
  if (datefnslocales[locale as keyofDateFnsLocale]) {
    // If the i18n locale exactly matches the date-fns one
    return datefnslocales[locale as keyofDateFnsLocale];
  } else if (datefnslocales[locale.replace('-', '') as keyofDateFnsLocale]) {
    // Removes the potential dash to match for instance "en-US" from i18n to "enUS" for date-fns
    return datefnslocales[locale.replace('-', '') as keyofDateFnsLocale];
  } else if (datefnslocales[locale.split('-')[0] as keyofDateFnsLocale]) {
    // Takes the part before the potential dash to try, for instance "fr-FR" in i18n to "fr"
    return datefnslocales[locale.split('-')[0] as keyofDateFnsLocale];
  }
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
