import VueI18n, { Path, Values } from 'vue-i18n/types';

/**
 * Overloads VueI18n interface to avoid needing to cast return value to string.
 * See https://github.com/kazupon/vue-i18n/issues/410
 */
declare module 'vue-i18n/types' {
  export default class VueI18n {
    t(key: Path, values?: Values): string;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $t: typeof VueI18n.prototype.t;
  }

  interface VueConstructor {
    i18n: typeof VueI18n.prototype;
  }
}

export default VueI18n;
