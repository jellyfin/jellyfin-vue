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
  import type { LanguageKeys } from './types/i18next';

  export const resources: Record<string, () => Promise<Record<LanguageKeys, string>>>;
}
