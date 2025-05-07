import type en from '../strings/en.json';

export type LanguageKeys = typeof en;

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: Record<string, LanguageKeys>;
    strictKeyChecks: true;
  }
}

/**
 * This is important: https://stackoverflow.com/a/64189046
 * https://www.typescriptlang.org/docs/handbook/modules.html
 */
export { };
