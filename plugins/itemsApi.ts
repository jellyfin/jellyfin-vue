import { Context } from '@nuxt/types';
import { ItemsApi } from '../api/api';
import { Configuration } from '../api/configuration';

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

export default (context: Context, inject: Function) => {
  const config = new Configuration();

  const itemsApi = new ItemsApi(config, '', context.$axios);
  inject('itemsApi', itemsApi);
};
