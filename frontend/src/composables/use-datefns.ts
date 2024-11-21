import * as datefnslocales from 'virtual:locales/date-fns';
import { i18n } from '@/plugins/i18n';
import { isObj } from '@/utils/validation';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Use any date fns function with proper localization, based on the current locale.
 * Pass the date-fns function to invoke as the first parameter,
 * and it's parameters as the second parameter
 *
 * THIS FUNCTION MUST BE CALLED INSIDE A COMPUTED PROPERTY OR A TEMPLATE FOR CHANGES TO THE CURRENT LOCALE TO BE REFLECTED
 *
 * @param func - date-fns function to invoke
 * @param params - Parameters to pass to the date-fns function
 */
export function useDateFns<T extends (...a: any[]) => any>(
  func: T,
  ...params: Parameters<T>
): ReturnType<T> {
  /**
   * We need to remove the hyphen of our locale codes, as using named exports with them is not valid JS syntax
   */
  const importCode = i18n.locale.value.replace(
    '-',
    ''
  ) as keyof typeof datefnslocales;

  if (isObj(params.at(-1)) && !(params.at(-1) instanceof Date)) {
    params.at(-1).locale = datefnslocales[importCode];
  } else {
    params.push({ locale: datefnslocales[importCode] });
  }

  return func(...params);
}

/* eslint-enable @typescript-eslint/no-explicit-any */
