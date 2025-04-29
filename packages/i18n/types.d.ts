import type en from './strings/en.json';

interface FallbackLanguage {
  translation: typeof en;
};
interface Resources {
  en: FallbackLanguage;
  [key: string]: FallbackLanguage;
}

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: Resources;
    strictKeyChecks: true;
  }
}

declare module 'virtual:locales/date-fns' {
  import * as locales from 'date-fns/locale';

  export = locales;
}

declare module 'virtual:locales/vuetify' {
  import type * as locales from 'vuetify/locale';

  const typeWithoutRtl: BetterOmit<typeof locales, 'defaultRtl'>;

  export = typeWithoutRtl;
}

declare module 'virtual:i18next/resources' {
  export const resources: Resources;
}

/**
 * This is important: https://stackoverflow.com/a/64189046
 * https://www.typescriptlang.org/docs/handbook/modules.html
 */
export { };
