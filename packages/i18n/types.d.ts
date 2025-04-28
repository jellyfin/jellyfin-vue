import type en from './strings/en.json';

type FallbackLanguage = typeof en;

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      en: FallbackLanguage;
      [key: string]: FallbackLanguage;
    };
    strictKeyChecks: true;
  }
}

/**
 * This is important: https://stackoverflow.com/a/64189046
 * https://www.typescriptlang.org/docs/handbook/modules.html
 */

export { };
