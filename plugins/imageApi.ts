import { Plugin } from '@nuxt/types';
import { AxiosInstance } from 'axios';
import { ImageApi } from '~/api/api';
import { Configuration } from '~/api/configuration';

declare module '@nuxt/types' {
  interface Context {
    $imageApi: ImageApi;
  }

  interface NuxtAppOptions {
    $imageApi: ImageApi;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $imageApi: ImageApi;
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    $imageApi: ImageApi;
  }
}

const imageApiPlugin: Plugin = (context, inject) => {
  const config = new Configuration();

  const imageApi = new ImageApi(config, '', context.$axios as AxiosInstance);
  inject('imageApi', imageApi);
};

export default imageApiPlugin;
