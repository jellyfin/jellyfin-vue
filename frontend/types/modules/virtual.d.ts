declare module 'virtual:locales/date-fns' {
  import * as locales from 'date-fns/esm/locale';

  export = locales;
}

declare module 'virtual:locales/vuetify' {
  import * as locales from 'vuetify/locale';

  const typeWithoutRtl: Omit<typeof locales, 'defaultRtl'>;

  export = typeWithoutRtl;
}

declare module 'virtual:locales/vuetify/rtl' {
  export { defaultRtl } from 'vuetify/locale';
}

declare module 'virtual:commit' {
  export const commit_hash: string | undefined;
}
