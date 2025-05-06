import { readFile, readdir } from 'node:fs/promises';
import { resolve, parse } from 'node:path';
import { genObjectFromRaw } from 'knitwork';

export const localeFilesFolder = resolve(import.meta.dirname, '../strings');

/**
 * Load strings into a JavaScript object
 */
async function loadLocaleFiles(localeFiles: string[]) {
  const resources: Record<string, string> = {};

  for (const file of localeFiles) {
    const filePath = resolve(localeFilesFolder, file);

    resources[parse(file).name] = await readFile(filePath, 'utf8');
  }

  return resources;
}

/**
 * Normalizes the locale names from the JSON files to ESM-compatible exports
 */
function localeTransform(keys: string[], l: string): string | undefined {
  const testStrings = l.split('-');
  const lang = testStrings.join('');

  /**
   * - If the i18n locale exactly matches the one from the module
   * - Removes the potential dash to match for instance "en-US" from i18n to "enUS" for the module.
   *   We also need to remove all the hyphens, as using named exports with them is not valid JS syntax
   */
  if (keys.includes(l) || keys.includes(lang)) {
    return lang;
    /**
     * Takes the part before the potential hyphen to try, for instance "fr-FR" in i18n to "fr"
     */
  } else if (testStrings[0] && keys.includes(testStrings[0])) {
    return `${testStrings[0]} as ${lang}`;
  }
}

/**
 * Gets the date-fns locale objects that match our languages
 */
async function getDateFnsLocales(localeNames: string[]) {
  const dfnskeys = Object.keys(await import('date-fns/locale'));
  const dfnsExports = localeNames
    .map(l => localeTransform(dfnskeys, l))
    .filter((l): l is string => typeof l === 'string');

  /**
   * date-fns exports all english locales with variants, so we need to add the match manually
   */
  dfnsExports.unshift('enUS as en');

  return dfnsExports;
}

/**
 * Parses Vuetify locales
 */
async function getVuetifyLocales(localeNames: string[]) {
  const vuetify = await import('vuetify/locale');
  const vuetifyKeys = Object.keys(vuetify);
  const vuetifyExports = localeNames
    .map(l => localeTransform(vuetifyKeys, l))
    .filter((l): l is string => typeof l === 'string');

  return vuetifyExports;
}

/**
 * Using virtual modules allows us to:
 * - Import JSON files from the strings folder
 * - Match our locales to the date-fns and Vuetify ones.
 * In order to reduce bundle size, we calculate here (at build time) only the locales that we
 * have defined in the "localeFilesFolder", to include only those, instead of importing all of them.
 *
 * We expose them later as `virtual:i18next/resources`, `virtual:date-fns/locales`
 * and `virtual:vuetify/locales` using `@rollup/plugin-virtual`
 */
export async function genVirtualModules(): Promise<Record<string, string>> {
  const i18next_prefix = 'virtual:i18next/resources';
  const localeFiles = await readdir(localeFilesFolder);
  const localeNames = localeFiles.map(l => l.replace('.json', ''));
  const resources = await loadLocaleFiles(localeFiles);
  const dfnsExports = await getDateFnsLocales(localeNames);
  const vuetifyExports = await getVuetifyLocales(localeNames);
  const modules: Record<string, string> = {};

  for (const locale in resources) {
    modules[`${i18next_prefix}/${locale}`] = `export default ${resources[locale]}`;
  }

  for (const locale in resources) {
    resources[locale] = `async () => (await import('${i18next_prefix}/${locale}')).default`;
  }

  return {
    'virtual:locales/date-fns': `export { ${dfnsExports.join(
      ', '
    )} } from 'date-fns/locale'`,
    'virtual:locales/vuetify': `export { ${vuetifyExports.join(
      ', '
    )} } from 'vuetify/locale'`,
    ...modules,
    'virtual:i18next/resources': `export const resources = ${genObjectFromRaw(resources)}`
  };
}
