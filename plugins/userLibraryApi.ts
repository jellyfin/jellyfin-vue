import { Context } from '@nuxt/types';
import { AxiosInstance } from 'axios';
import { UserLibraryApi } from '~/api/api';
import { Configuration } from '~/api/configuration';
import { PluginInjection } from '~/types/utils';

declare module '@nuxt/types' {
  interface Context {
    $userLibraryApi: UserLibraryApi;
  }

  interface NuxtAppOptions {
    $userLibraryApi: UserLibraryApi;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $userLibraryApi: UserLibraryApi;
  }
}

export default (context: Context, inject: PluginInjection): void => {
  const config = new Configuration();

  const userLibraryApi = new UserLibraryApi(
    config,
    '',
    context.$axios as AxiosInstance
  );
  inject('userLibraryApi', userLibraryApi);
};
