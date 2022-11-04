import 'vue-router';
import { AxiosInstance } from 'axios';
import Swiper from 'swiper';

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string;
    transition?: string;
    public?: boolean;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $api: AxiosInstance;
    $swiper: Swiper;
  }
}
