import { Context } from '@nuxt/types';
import { AxiosInstance } from 'axios';
import { UserViewsApi } from '~/api/api';
import { Configuration } from '~/api/configuration';
import { PluginInjection } from '~/types/utils';

declare module '@nuxt/types' {
  interface Context {
    $userViewsApi: UserViewsApi;
  }

  interface NuxtAppOptions {
    $userViewsApi: UserViewsApi;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $userViewsApi: UserViewsApi;
  }
}

export default (context: Context, inject: PluginInjection): void => {
  const config = new Configuration();

  const userViewsApi = new UserViewsApi(
    config,
    '',
    context.$axios as AxiosInstance
  );
  inject('userViewsApi', userViewsApi);
};
