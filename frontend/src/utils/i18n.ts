import { isStr } from '@jellyfin-vue/shared/validation';
import { upperFirst } from '#/utils/data-manipulation';

/**
 * Given a locale code, return the language name of another locale
 */
export function getLocaleName(
  fromCode: string,
  toCode = 'en'
): string | undefined {
  const r = new Intl.DisplayNames([toCode], { type: 'language' }).of(fromCode);

  return isStr(r) ? upperFirst(r) : r;
}

/**
 * Given a locale code, return the language name in that locale
 */
export function getLocaleNativeName(code: string): string | undefined {
  return getLocaleName(code, code);
}
