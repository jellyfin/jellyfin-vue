declare module 'virtual:locales/date-fns' {
  import * as locales from 'date-fns/locale';

  export = locales;
}

declare module 'virtual:locales/vuetify' {
  import type * as locales from 'vuetify/locale';

  const typeWithoutRtl: BetterOmit<typeof locales, 'defaultRtl'>;

  export = typeWithoutRtl;
}

declare module 'virtual:locales/vuetify/rtl' {
  export { defaultRtl } from 'vuetify/locale';
}

declare module 'virtual:commit' {
  export const commit_hash: string | undefined;
}
