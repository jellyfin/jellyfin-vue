import type en from './strings/en.json';

type Resources = Record<string, () => Promise<typeof en>>;

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

  const typeWithoutRtl: Omit<typeof locales, 'defaultRtl'>;

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
