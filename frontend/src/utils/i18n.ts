/**
 * Given a locale code, return the language name of another locale
 */
export function getLocaleName(
  fromCode: string,
  toCode = 'en'
): string | undefined {
  const r = new Intl.DisplayNames([toCode], { type: 'language' }).of(fromCode);

  return r ? r.charAt(0).toUpperCase() + r.slice(1) : undefined;
}

/**
 * Given a locale code, return the language name in that locale
 */
export function getLocaleNativeName(code: string): string | undefined {
  return getLocaleName(code, code);
}
