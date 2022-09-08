import 'vue-router';
import AxiosInstance from 'axios';
import Swiper from 'swiper';

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string;
    transition?: string;
    public?: boolean;
  }
}

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
    $api: typeof AxiosInstance;
    $swiper: Swiper;
  }
}
