import { Context } from '@nuxt/types';
import { ImageApi } from '~/api/api';
import { Configuration } from '~/api/configuration';
import { PluginInjection } from '~/types/utils';

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

export default (context: Context, inject: PluginInjection): void => {
  const config = new Configuration();

  const imageApi = new ImageApi(config, '', context.$axios);
  inject('imageApi', imageApi);
};
