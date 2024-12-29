/**
 * We need to match our locales to the date-fns and Vuetify ones for proper localization.
 * In order to reduce bundle size, we calculate here (at build time) only the locales that we
 * have defined in the "locales" folder, to include only those, instead of importing all of them.
 *
 * We expose them later as 'virtual:date-fns/locales' and 'virtual:vuetify/locales' using @rollup/plugin-virtual
 */
import { readdirSync } from 'node:fs';
import { localeFilesFolder } from './paths';

const localeFiles = readdirSync(localeFilesFolder.replace('**', ''));
const localeNames = localeFiles.map(l => l.replace('.json', ''));

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
  } else if (keys.includes(testStrings[0])) {
    return `${testStrings[0]} as ${lang}`;
  }
}

/**
 * Date-fns locale parsing
 */
const dfnskeys = Object.keys(await import('date-fns/locale'));
/**
 * We need this due to the differences between the vue i18n and date-fns locales.
 */
const dfnsExports = localeNames
  .map(l => localeTransform(dfnskeys, l))
  .filter((l): l is string => typeof l === 'string');

/**
 * Vuetify locale parsing
 */
const vuetify = await import('vuetify/locale');
const vuetifyKeys = Object.keys(vuetify);
const vuetifyExports = localeNames
  .map(l => localeTransform(vuetifyKeys, l))
  .filter((l): l is string => typeof l === 'string');

/**
 * Get commit hash
 */
const commit_available = !Number(process.env.IS_STABLE) && !!process.env.COMMIT_HASH;
const commit_hash = (commit_available && `'${process.env.COMMIT_HASH}'`) || undefined;

/**
 * Date-fns exports all english locales with variants, so we need to add the match manually
 */
dfnsExports.unshift('enUS as en');

export default {
  'virtual:locales/date-fns': `export { ${dfnsExports.join(
    ', '
  )} } from 'date-fns/locale'`,
  'virtual:locales/vuetify': `export { ${vuetifyExports.join(
    ', '
  )} } from 'vuetify/locale'`,
  'virtual:commit': `export const commit_hash = ${commit_hash}`
};
