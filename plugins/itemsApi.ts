import { Plugin } from '@nuxt/types';
import { AxiosInstance } from 'axios';
import { ItemsApi } from '~/api/api';
import { Configuration } from '~/api/configuration';

declare module '@nuxt/types' {
  interface Context {
    $itemsApi: ItemsApi;
  }

  interface NuxtAppOptions {
    $itemsApi: ItemsApi;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $itemsApi: ItemsApi;
  }
}

const itemsApiPlugin: Plugin = (context, inject) => {
  const config = new Configuration();

  const itemsApi = new ItemsApi(config, '', context.$axios as AxiosInstance);
  inject('itemsApi', itemsApi);
};

export default itemsApiPlugin;
